// Copyright Tom Collins, 3.3.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for bassline representations for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "midi": "/Users/tomthecollins/Shizz/York/Projects/AI\ Eurovision/AI\ SONG\ CONTEST\ DATASET/",
    "midiDirs": [ "MIDI" ],
    "outputDir": __dirname + "/stm/",
    "outputFileName": "aiev2020_data_bass"
  },
  "anotherUser": {
    // ...
  }
}

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const an = require("./analyze")

// Parameters
const targetChannel = 2 // Should be where the basslines are encoded.
const param = {
  "stateType": "beat_rel_MNN_state",
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

// Import and analyse the MIDI files.
let midiDirs = fs.readdirSync(mainPath["midi"]);
midiDirs = midiDirs.filter(function(midiDir){
  return mainPath["midiDirs"].indexOf(midiDir) >= 0;
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir);
  let pComps = [];
  let pFiles = fs.readdirSync(mainPath["midi"] + midiDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "midi"
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      const midiData = fs.readFileSync(mainPath["midi"] + midiDir + "/" + pFile);
      const midi = new Midi(midiData)
      const timeSigs = [midi.header.timeSignatures.map(function(ts){
        return {
          "barNo": ts.measures + 1,
          "topNo": ts.timeSignature[0],
          "bottomNo": ts.timeSignature[1],
          "ontime": ts.ticks/midi.header.ppq
        }
      })[0]] // SUPER HACKY. REVISE LATER!
      console.log("timeSigs:", timeSigs)
      let points = []
      midi.tracks.map(function(track){
        if (track.channel == targetChannel){
          track.notes.map(function(n){
            points.push([
              n.ticks/midi.header.ppq,
              n.midi,
              n.durationTicks/midi.header.ppq,
              track.channel,
              Math.round(1000*n.velocity)/1000
            ])
          })
        }
      })
      console.log("points.slice(0, 5):", points.slice(0, 5));
      const fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles)
      console.log("fsm:", fsm)
      points.map(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      })
      let comp = an.note_point_set2comp_obj(
        points, timeSigs, false, [0, 1/4, 1/2, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
      );
      // console.log("comp:", comp);
      // Strip off file extension.
      pFile = pFile.split(".")[0];
      comp["id"] = pFile
      // comp["id"] = uu();
      // comp["idGmd"] = pFile
      comp["name"] = pFile;
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      pComps.push(comp);
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
    mainPath["outputDir"] + mainPath["outputFileName"] + ".js",
    // "var perc_" + midiDir + " = " +
    JSON.stringify(pStm)//, null, 2)
    // + ";"
  )

  let pInitialDistbn = an.construct_initial(pComps, param)
  pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  fs.writeFileSync(
    mainPath["outputDir"] + mainPath["outputFileName"] + "_initial.js",
    // "var perc_" + midiDir + " = " +
    JSON.stringify(pInitialDistbn)//, null, 2)
    // + ";"
  )

})
