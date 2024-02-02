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
const mm = require("maia-markov")
const an = new mm.Analyzer()
const ch = require("./../midi_preprocess/dexplore/cv_and_hist.js")
const tx = require("./../midi_preprocess/dexplore/track_extract_util.js")

// Individual user paths
const mainPaths = {
  "tom": {
    "midi": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Projects", "AI\ Eurovision",
      "2023", "io", "midi"
    ),
    "midiDirs": ["midi_1"],
    "outputDir": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Projects", "AI\ Eurovision",
      "2023", "io", "for_maia_markov"
    ),
    "outputFileName": "aisc23_rnbnr_apr23_chords_midi_1_500"
  },
  "kyle": {
    "midi": path.join(
      "/Volumes", "Magneto", "DataSets", "geerdes_midi", "mid"),
    "midiDirs": ["midi_1"],
    "outputDir": path.join(
      "/Volumes", "Magneto", "DataSets", "data_for_maia_markov"
    ),
    "outputFileName": "aisc23_rnbnr_apr23_chords_midi_1_500"
  }
}

// Parameters
// Some of these are specific to the Markov modelling, which has now been
// commented out of this script.
const param = {
  "stateType": "beat_rel_sq_MNN_state",
  "onAndOff": false,
  "squashRangeMidi": 12,
  "nosConsecutives": 4,
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
    return file.split(".")[3] == "mid"
  })
  console.log("files.length:", files.length)

  files
  .slice(0, 500)
  .forEach(function(file, iFile){
    console.log("file:", file)
    const fid = file.split(".mid")[0]
    if (iFile % 10 === 0){
      console.log("FILE " + (iFile + 1) + " OF " + files.length + ".")
    }
    try {
      const midiData = fs.readFileSync(
        path.join(mainPath["midi"], midiDir, file)
      )
      const midi = new Midi(midiData)
      let htrack = tx.find_homophonic_track(midi, false)
      console.log("htrack:", htrack)
      if (htrack !== undefined){
        const timeSigs = [midi.header.timeSignatures.map(function(ts){
          return {
            "barNo": ts.measures + 1,
            "topNo": ts.timeSignature[0],
            "bottomNo": ts.timeSignature[1],
            "ontime": ts.ticks/midi.header.ppq
          }
        })[0]] // SUPER HACKY. REVISE LATER!
        if (timeSigs[0].topNo !== 4){
          console.log("timeSigs:", timeSigs)
        }
        let allPoints = [], dbPoints = [], tonalPoints = [], trgPoints = []
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
            if (
              !param.downbeat.drumsOnly ||
              param.downbeat.drumsOnly && track.instrument.family === "drums"
            ){
              dbPoints.push(pt)
            }
            if (track.instrument.family !== "drums"){
              tonalPoints.push(pt)
            }
            if (htrack[1] === trgTestStr){
              // console.log("Pushing!")
              trgPoints.push(pt)
            }
          })
        })
        if (dbPoints.length === 0) {
          console.log("No downbeat detection points. Reverting to full dataset!")
          dbPoints = allPoints
        }
        dbPoints = mu.copy_array_object(mu.sort_rows(dbPoints)[0])
        tonalPoints = mu.copy_array_object(mu.sort_rows(tonalPoints)[0])
        console.log("trgPoints.length:", trgPoints.length)
        trgPoints = mu.copy_array_object(mu.sort_rows(trgPoints)[0])
        // console.log("trgPoints.slice(0, 5):", trgPoints.slice(0, 5))

        // Downbeat estimation and correction
        const dbCorrect = ch.correct_downbeat(dbPoints, param.downbeat)
        // console.log("dbCorrect.confidence:", dbCorrect.confidence)
        // console.log("dbCorrect.startsOnBeatEst:", dbCorrect.startsOnBeatEst)
        // console.log(dbCorrect.pointSet.slice(0, 3))
        tonalPoints.forEach(function(p){
          p[param.downbeat.ontimeIndex] += param.downbeat.beatsInMeasure
          - dbCorrect.startsOnBeatEst + 1
        })
        trgPoints.forEach(function(p){
          p[param.downbeat.ontimeIndex] += param.downbeat.beatsInMeasure
          - dbCorrect.startsOnBeatEst + 1
        })

        // Key detection
        const fsm = mu.fifth_steps_mode(tonalPoints, mu.krumhansl_and_kessler_key_profiles)
        // console.log("fsm:", fsm)
        trgPoints.forEach(function(p){
          p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
        })
        let comp = an.note_point_set2comp_obj(
          trgPoints, timeSigs, false, [0, 1/4, 1/3, 1/2, 2/3, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
        )
        console.log("comp.notes.length:", comp.notes.length)
        // console.log("comp.notes.slice(0, 3):", comp.notes.slice(0, 3))
        if (comp["notes"].length > 0){
          comp["id"] = "" + fid
          comp["name"] = "" + fid
          comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
          comps.push(comp)
        }
      } // if (htrack !== undefined){
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
stm = an.prune_stm(stm, param)
console.log("pStm.length:", stm.length)
// console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
// console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
fs.writeFileSync(
  path.join(mainPath["outputDir"], mainPath["outputFileName"] + ".js"),
  JSON.stringify(stm)//, null, 2)
)

let initialDistbn = an.construct_initial(comps, param)
initialDistbn = an.prune_initial(initialDistbn, stm, param)
fs.writeFileSync(
  path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_initial.js"),
  JSON.stringify(initialDistbn)//, null, 2)
)
