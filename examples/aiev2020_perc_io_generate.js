// Copyright Tom Collins, 2.3.2020
// Generating percussion excerpts in 4-4 time for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "stm": __dirname + "/stm/edm_perc_json_from_lisp.js",
    "initial": __dirname + "/stm/edm_perc_json_from_lisp_initial.js",
    "outputDir": __dirname + "/out/edm_perc/"
  },
  "anotherUser": {
    "stm": "",
    "initial": "",
    "outputDir": ""
  }
}

// Requires.
const fs = require("fs")
const sr = require('seed-random')
const { Midi } = require('@tonejs/midi')
const gn = require("./generate")
const an = require("./analyze")

// Set up parameters.
let seeds = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", "Potassium", "Calcium", "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc"]
let param = {
  "stateType": "beat_MNN_state",
  "pointReconstruction": "MNN",
  "timeSignatures": [ {"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0} ],
  "stm": null,
  "initial": null,
  "nosConsecutives": 4,
  "ontimeUpperLimit": 16,
  "indices": {
    "ontime": 0, "MNN": 1, "MPN": 2, "duration": 3, "channel": 4, "velocity": 5
  },
  "randCount": 0
}


// Grab user name from command line to set path to data.
let nextU = false
let pathsEtc;
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    pathsEtc = mainPaths[arg]
    nextU = false
  }
})
// fs.mkdir(outdir);

const stmStr = fs.readFileSync(pathsEtc.stm);
param.stm = JSON.parse(stmStr);
const initialStr = fs.readFileSync(pathsEtc.initial);
param.initial = JSON.parse(initialStr);
// console.log("stm:", stm)

// Seed random number generation.
sr('Lion', {global: true}); // Overrides global Math.random.
// sr('christianeriksen', {global: true}); // Overrides global Math.random.
// var numA = Math.random();
// console.log(numA);
// sr.resetGlobal();// Reset to default Math.random.

seeds.map(function(seed){
  // Seed random number generation.
  sr(seed, {global: true})
  // Reset randCount, then generate states and points.
  param.randCount = 0
  console.log("randCount before get_abs_suggestion:", param.randCount)
  var gendOutput = gn.get_suggestion(param)
  console.log("randCount after get_abs_suggestion:", gendOutput.randCount)
  // console.log("gendOutput.points:", gendOutput.points)

  // Save points as a MIDI file and state-context pairs as a text file.
  let midi = new Midi()
  console.log("midi:", midi)
  let track = midi.addTrack()
  gendOutput.points.map(function(p){
    track.addNote({
      midi: p[param.indices.MNN],
      time: p[param.indices.ontime],
      duration: p[param.indices.duration],
      velocity: p[param.indices.velocity]
    })
  })
  fs.writeFileSync(
    pathsEtc.outputDir + "perc_" + seed + ".mid",
    new Buffer(midi.toArray())
  )
  track.notes = track.notes.map(function(n){
    n.time *= 0.5
    n.duration *= 0.5
    return n
  })
  fs.writeFileSync(
    pathsEtc.outputDir + "perc_" + seed + "_ableton.mid",
    new Buffer(midi.toArray())
  )
  fs.writeFileSync(
    pathsEtc.outputDir + "perc_" + seed + ".txt",
    JSON.stringify(gendOutput.stateContextPairs, null, 2)
  )
  // Trying to write to composition objects, but not a priority right now.
  // fs.writeFileSync(
  //   pathsEtc.outputJsonDir + "aiev_2020_perc_" + seed + ".json",
  //   JSON.stringify(
  //     an.note_point_set2comp_obj(gendOutput.points), null, 2
  //   )
  // )
})
