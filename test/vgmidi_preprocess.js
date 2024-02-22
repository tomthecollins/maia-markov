// Copyright Tom Collins, 6.5.2023
// Pre-processing MIDI files and building a Markov model for the AI Song Contest
// 2023 project. This script is based on one used in the AI Song Contest 2021
// project.

// Requires
const argv = require('minimist')(process.argv.slice(2))
const fs = require("fs")
const path = require("path")
// const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const mm = require('../dist/index')
const an = new mm.Analyzer()
const sr = require("seed-random")

// Individual user paths
const mainPaths = {
  "vgmidi": {
    "midi": path.join(
      "/home/chenyugao/puct-music-emotion/dataset/23rdOct_vgmidi_theme_var"),
    "midiDirs": ["train"],
    "outputDir": path.join(
      "/home/chenyugao/maia-markov/test/markov_out"
    ),
    "outputFileName": "vgmidi_train"
  }
}

// Parameters
// Some of these are specific to the Markov modelling, which has now been
// commented out of this script.
const param = {
  "seed": "Friday",
  "stateType": "beat_rel_sq_MNN_state",
  "onAndOff": false,
  "squashRangeMidi": 12,
  "nosConsecutives": 4, // 8, 
  "downbeat": {
    "histType": "drumsTrueVelocityTrue",
    "drumsOnly": true,
    "rounding": true,
    "granularity": 4,
    "beatsInMeasure": 4,
    "velocityIndex": 4,
    "ontimeIndex": 0
  }
}
sr(param.seed, {global: true})

// Grab user name from command line to set path to data.
const mainPath = mainPaths[argv.u]

// Import and analyse the MIDI files.
let comps = []
let midiDirs = fs.readdirSync(mainPath["midi"])
midiDirs = midiDirs.filter(function(midiDir){
  return mainPath["midiDirs"].indexOf(midiDir) >= 0
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir)
  let files = fs.readdirSync(path.join(mainPath["midi"], midiDir))
  files = files.filter(function(file){
    return path.extname(file) === ".mid"
  })
  console.log("files.length:", files.length)

  files
  .forEach(function(file, iFile){
    console.log("file:", file)
    // const fid = file.split("_")[0]
    const splitVarName = file.split("_")
    let fid = splitVarName[0]
    for(let i = 1; i < splitVarName.length-2; i ++){
      fid += ("_" + splitVarName[i])
    }
    console.log("fid:", fid)
    if (iFile % 10 === 0){
      console.log("FILE " + (iFile + 1) + " OF " + files.length + ".")
    }
    try {
      const midiData = fs.readFileSync(
        path.join(mainPath["midi"], midiDir, file)
      )
      const midi = new Midi(midiData)
      console.log("midi.header", midi.header)
      // const timeSigs = [midi.header.timeSignatures.map(function(ts){
      //   return {
      //     "barNo": ts.measures + 1,
      //     "topNo": ts.timeSignature[0],
      //     "bottomNo": ts.timeSignature[1],
      //     "ontime": ts.ticks/midi.header.ppq
      //   }
      // })[0]] // SUPER HACKY. REVISE LATER!
      const timeSigs = [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}]
      if (timeSigs[0].topNo !== 4){
        console.log("timeSigs:", timeSigs)
      }
      let allPoints = []
      midi.tracks.forEach(function(track, idx){
        const trgTestStr = track.instrument.family + " -> " + track.instrument.name
        console.log("trgTestStr:", trgTestStr)
        // console.log("track.instrument.family:", track.instrument.family)
        // console.log("track.instrument.name:", track.instrument.name)
        track.notes.forEach(function(n){
          let pt = [
            n.ticks/midi.header.ppq,
            n.midi,
            n.durationTicks/midi.header.ppq,
            track.channel,
            Math.round(1000*n.velocity)/1000
          ]
          allPoints.push(pt)
        })
      })

      // Key detection
      const fsm = mu.fifth_steps_mode(allPoints, mu.krumhansl_and_kessler_key_profiles)
      // console.log("fsm:", fsm)
      allPoints.forEach(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      })
      let comp = an.note_point_set2comp_obj(
        allPoints, timeSigs, false, [0, 1/4, 1/3, 1/2, 2/3, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
      )
      console.log("comp.notes.length:", comp.notes.length)
      // console.log("comp.notes.slice(0, 3):", comp.notes.slice(0, 3))
      if (comp["notes"].length > 0){
        comp["id"] = "" + fid
        comp["name"] = "" + fid
        comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
        comps.push(comp)
      }
       // if (htrack !== undefined){
    }
    catch (e) {
      console.log(e)
    }
  })
})

// Construct stm and initial distribution.
console.log("Construction time!")
console.log("comps.length:", comps.length)
let stm = an.construct_stm(comps, param)
console.log("stm.length:", stm.length)

// let stm = require(
//   path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_wo_purne" + ".json")
//   )
// console.log("stm.length:", stm.length)

stm = an.prune_stm(stm, param)
console.log("pStm.length:", stm.length)
// console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
// console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
fs.writeFileSync(
  path.join(mainPath["outputDir"], mainPath["outputFileName"] + ".json"),
  JSON.stringify(stm)
)
// fs.writeFileSync(
//   path.join(mainPath["outputDir"], mainPath["outputFileName"] + ".json"),
//   JSON.stringify(stm, null, 2)
// )
// writeStringToFile(stm, path.join(mainPath["outputDir"], mainPath["outputFileName"] + ".json"))

// // We do not need "initial states" in variation generation project.
// let initialDistbn = an.construct_initial(comps, param)
// initialDistbn = an.prune_initial(initialDistbn, stm, param)
// fs.writeFileSync(
//   path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_initial.json"),
//   JSON.stringify(initialDistbn, null, 2)
// )

let scl = an.construct_scl(comps, param)
fs.writeFileSync(
  path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_scl.json"),
  JSON.stringify(scl)
)
