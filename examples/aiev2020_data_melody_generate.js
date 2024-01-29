// Copyright Tom Collins, 3.3.2020
// Generating melody excerpts in 4-4 time for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "stm": __dirname + "/stm/aiev2020_data_melody.js",
    "initial": __dirname + "/stm/aiev2020_data_melody_initial.js",
    "outputDir": __dirname + "/out/aiev_data_melody/"
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

// Set up parameters.
let seeds = ["Almond", "Birch", "Chestnut", "Cress", "Daisy", "Elderberry", "Fennel", "Flax", "Garlic", "Holly", "Ivy", "Juniper", "Kudzu", "Lilac", "Maple", "Moosewood", "Nightshade", "Olive", "Pear", "Quercitron", "Rose", "Snowdrop", "Sunflower", "Tea", "Thistle", "Violet", "Walnut", "Willow", "Yarro", "Zebrawood"]
let param = {
  "stateType": "beat_rel_MNN_state",
  "pointReconstruction": "rel_MNN",
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

  // Convert points to a key according to the initial state.
  gendOutput.points = gendOutput.points.map(function(p){
    p[param.indices.MNN] += gendOutput.stateContextPairs[0].context
    .tonic_pitch_closest[0] //60
    p[param.indices.MPN] += gendOutput.stateContextPairs[0].context
    .tonic_pitch_closest[1] //60
    return p
  })

  // Save points as a MIDI file and state-context pairs as a text file.
  let midi = new Midi()
  console.log("midi.header:", midi.header)
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
    pathsEtc.outputDir + "melody_" + seed + ".mid",
    new Buffer(midi.toArray())
  )
  // track.notes = track.notes.map(function(n){
  //   n.time *= 0.5
  //   n.duration *= 0.5
  //   return n
  // })
  // fs.writeFileSync(
  //   pathsEtc.outputDir + "melody_" + seed + "_ableton.mid",
  //   new Buffer(midi.toArray())
  // )
  fs.writeFileSync(
    pathsEtc.outputDir + "melody_" + seed + ".txt",
    JSON.stringify(gendOutput.stateContextPairs, null, 2)
  )
})
