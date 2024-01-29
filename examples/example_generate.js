// Individual user paths.
var mainPaths = {
  "tom": __dirname + "/stm/0_perc.js",
  "anotherUser": __dirname + "/path/to/folder/of/json,midi,etc/folders/"
};

// Requires.
const fs = require("fs")
const sr = require('seed-random')
const { Midi } = require('@tonejs/midi')
const ge = require("./generate")

// Seed random number generation.
sr('harrykane', {global: true}); // Overrides global Math.random.
// sr('christianeriksen', {global: true}); // Overrides global Math.random.
let randIdx = 0
// var numA = Math.random();
// console.log(numA);
// sr.resetGlobal();// Reset to default Math.random.

// Grab user name from command line to set path to data.
var nextU = false
var mainPath;
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    mainPath = mainPaths[arg]
    nextU = false
  }
})
// Make output directory.
var outdir = mainPath + "out/";
// fs.mkdir(outdir);

var stmStr = fs.readFileSync(mainPath);
var stm = JSON.parse(stmStr);
// console.log("stm:", stm)

console.log("randIdx before get_abs_suggestion:", randIdx)
var gendOutput = ge.get_suggestion(stm, undefined, "beat_MNN_state", randIdx)
console.log("randIdx after get_abs_suggestion:", gendOutput.randIdx)
console.log("gendOutput.points:", gendOutput.points)

// var midi = new Midi()
// console.log("midi:", midi)
// const track = midi.addTrack()
// gendOutput.points.map(function(p){
//   track.addNote({
//     midi : p[1],
//     time : p[0],
//     duration: p[3],
//     velocity: p[5]
//   })
// })
// fs.writeFileSync("./gendOutput.mid", new Buffer(midi.toArray()))
