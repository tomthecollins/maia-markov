// Copyright Tom Collins, 21.1.2024
// Pre-processing MIDI files, calculating their mean MIDI note number, and
// writing them to file.

// Requires
const argv = require('minimist')(process.argv.slice(2))
const fs = require("fs")
const path = require("path")
const plotlib = require("nodeplotlib")
const mm = require("maia-markov")
const mu = require("maia-util")
const an = new mm.Analyzer()

// Individual user paths
const mainPaths = {
  "tom": {
    "inDir": path.join(
      "/Users", "tomthecollins", "Shizz", "UMiami", "Teaching", "511-611",
      "spring24", "homeworks", "hw_3", "music_data", "5_hip_hop_midis"
    ),
    "outDir": path.join(
      "/Users", "tomthecollins", "Shizz", "UMiami", "Teaching", "511-611",
      "spring24", "homeworks", "hw_3", "music_data", "5_hip_hop_basslines"
    )
  },
  "anotherUser": {
    // ...
  }
}

// Parameters
const param = {
  "scaleFactor": 1,
  "timeSigTopNo": 4,
  "timeSigBottomNo": 4,
  "noteIndices": {
    "ontimeIndex": 0,
    "mnnIndex": 1,
    "durationIndex": 2,
    "channelIndex": 3,
    "velocityIndex": 4
  }
}

// Declare/initialize the variables that will contain the results of the analysis.
// ...

// Import and analyse the MIDI files.
const mainPath = mainPaths[argv.u]
console.log("Here we go!")
let files = fs.readdirSync(mainPath["inDir"])
files = files.filter(function(file){
  return path.extname(file) === ".mid"
})
console.log("files.length:", files.length)

// Iterate.
files
// .slice(0, 1)
.forEach(function(file, ithFile){
  console.log("ithFile:", ithFile)
  const fid = file.split(".mid")[0]
  console.log("fid:", fid)
  try {
    const mi = new mm.MidiImport(path.join(mainPath["inDir"], file))
    // console.log("mi.data.tracks[14].channel:", mi.data.tracks[14].channel)
    // console.log("mi.data.tracks[14]:", mi.data.tracks[14])
    const bt = mi.find_bass_track()
    console.log("bt:", bt)
    if (bt.length === 0){
      console.log("No bass track identified")
      return
    }
    else if (bt.length > 1){
      console.log("Multiple candidates for bass track. Returning first one.")
    }
    const points = mi.points.filter(function(pt){
      return pt[param.noteIndices.channelIndex] === mi.data.tracks[bt[0][0]].channel
    })
    console.log("points.slice(0, 3):", points.slice(0, 3))
    // Write output(s) to file.
    // Export MIDI.
    new mm.MidiExport(points, [], path.join(mainPath["outDir"], file), param)

  }
  catch (e) {
    console.log(e)
  }
})
