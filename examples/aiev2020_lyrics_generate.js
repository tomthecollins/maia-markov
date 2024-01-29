// Copyright Tom Collins, 2.3.2020
// Generating tonal excerpts in 4-4 time for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "stm": __dirname + "/stm/heap_lyrics.js",
    "initial": __dirname + "/stm/heap_lyrics_initial.js",
    "outputDir": __dirname + "/out/heap_lyrics/"
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
let seeds = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France"]
let param = {
  "stateType": "lyrics_state",
  "wordLimit": 100,
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
  console.log("randCount before get_lyrics_suggestion:", param.randCount)
  var gendOutput = gn.get_lyrics_suggestion(param)
  console.log("randCount after get_lyrics_suggestion:", gendOutput.randCount)

  // Save to a text file and state-context pairs as a text file.
  fs.writeFileSync(
    pathsEtc.outputDir + "lyrics_" + seed + ".txt",
    gendOutput.words,
    "utf8"
  )
  fs.writeFileSync(
    pathsEtc.outputDir + "lyrics_states_" + seed + ".txt",
    JSON.stringify(gendOutput.stateContextPairs, null, 2)
  )
})
