// Copyright Tom Collins, 2.3.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for percussion excerpts in 4-4 time for AI Eurovision 2020
// project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "midi": "/Users/tomthecollins/Shizz/York/Projects/AI\ Eurovision/drums/",
    "outputDir": __dirname + "/stm/"
  },
  "anotherUser": {
    "stm": "",
    "initial": "",
    "outputDir": ""
  }
}

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const an = require("./analyze")

// Parameters
const param = {
  "stateType": "beat_MNN_state",
  "onAndOff": false,
  "nosConsecutives": 4
}

// Grab user name from command line to set path to data.
let nextU = false
let mainPath;
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    mainPath = mainPaths[arg]
    nextU = false
  }
})
// fs.mkdir(outdir);

// Metadata
let stmMd = require(mainPath["midi"] + "stm_metadata_variable")
console.log("stmMd.length:", stmMd.length)
stmMd = stmMd.filter(function(d){
  return d.startsOnBeat !== null
})
console.log("stmMd:", stmMd)
const stmMdNames = stmMd.map(function(d){
  return d.id
})

// Import and analyse the MIDI files.
let midiDirs = fs.readdirSync(mainPath["midi"]);
midiDirs = midiDirs.filter(function(midiDir){
  return midiDir == "json_from_lisp";
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir);
  let pComps = [];
  let pFiles = fs.readdirSync(mainPath["midi"] + midiDir);
  pFiles = pFiles.filter(function(pFile){
    const pFileSplit = pFile.split(".")
    return pFileSplit[2] == "json" &&
    stmMdNames.indexOf(pFileSplit[0] + "." + pFileSplit[1]) >= 0
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    const pFileSplit = pFile.split(".")
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      const midiData = require(mainPath["midi"] + midiDir + "/" + pFile);
      const timeSigs = [
        {
          "barNo": 1,
          "topNo": 4,
          "bottomNo": 4,
          "ontime": 0
        }
      ]
      let points = []
      const relIdx = stmMd.findIndex(function(d){
        return d.id == pFileSplit[0] + "." + pFileSplit[1]
      })
      console.log("relIdx:", relIdx)
      midiData.map(function(n){
        if (n[1] >= 36 && n[1] <= 56){
          points.push([
            n[0] + 4 - (stmMd[relIdx].startsOnBeat - 1),
            n[1],
            n[2],
            n[3],
            Math.round(1000*n[4]/127)/1000
          ])
        }
      })
      console.log("points.slice(0, 5):", points.slice(0, 5));
      // Percussion so key estimate is inappropriate.
      // const fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles)
      // console.log("fsm:", fsm)
      points.map(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], 0, 0))
      })
      let comp = an.note_point_set2comp_obj(
        points, timeSigs, true, [0, 1/4, 1/2, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
      );
      // Strip off file extension.
      pFile = pFile.split(".")[0];
      comp["id"] = pFile
      // comp["id"] = uu();
      // comp["idGmd"] = pFile
      comp["name"] = pFile;
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      // console.log("comp.notes.slice(0, 5):", comp.notes.slice(0, 5))
      pComps.push(comp);

      // Writing out to test some beat shifting.
      let midi2 = new Midi()
      let track = midi2.addTrack()
      comp.notes.map(function(n){
        track.addNote({
          midi : n.MNN,
          time : n.ontime,
          duration: n.duration
        })
      })
      fs.writeFileSync(
        mainPath["midi"] + "midi_check/" + pFileSplit[0] + "." + pFileSplit[1] + ".mid",
        new Buffer(midi2.toArray())
      )
    }
    catch (e) {
      console.log(e)
    }
  });
  let pStm = an.construct_stm(pComps, param)
  // console.log("pStm.length:", pStm.length);
  pStm = an.prune_stm(pStm, param)
  // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  fs.writeFileSync(
    mainPath["outputDir"] + "edm_perc_" + midiDir + ".js",
    // "var perc_" + midiDir + " = " +
    JSON.stringify(pStm)//, null, 2)
    // + ";"
  )

  let pInitialDistbn = an.construct_initial(pComps, param)
  pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  fs.writeFileSync(
    mainPath["outputDir"] + "edm_perc_" + midiDir + "_initial.js",
    // "var perc_" + midiDir + " = " +
    JSON.stringify(pInitialDistbn)//, null, 2)
    // + ";"
  )

})
