// Requires
const argv = require('minimist')(process.argv.slice(2))
const fs = require("fs")
const path = require("path")
const plotlib = require("nodeplotlib")
const mm = require("../dist/index")
// const me = require("../dist/MelodyExtractor")
const mu = require("maia-util")
// const an = new mm.Analyzer()
const { Midi } = require('@tonejs/midi')


// const ps = [[1, 64, 3], [1, 65, 1], [2, 67, 1.5], [4, 67, 1], [1, 64, 1]]
// const w = 2
// console.log(mu.count_rows(ps, w))

// const ps2 = [[1, 64], [1, 65], [2, 67], [4, 67], [1, 64]]
// console.log(mu.count_rows(ps2))
// return

// Individual user paths
const mainPaths = {
  "tom": {
    "inDir": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Kyle\ Worrall",
      "midis_to_test_melody_extraction", "midi_in"
    ),
    "outDir": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Kyle\ Worrall",
      "midis_to_test_melody_extraction", "out"
    ),
    "outFileName": "blah"
  },
  "kyle": {
    "inDir": path.join(
      "/Users", "gaochenyu", "Chenyu\ Gao", "MusicAI\ Research", "automatic_arranging",
      "melody\ extraction", "selected_sourceMIDI", "40MIDIs_forAlgorithms"
    ),
    "outDir": path.join(
      "./out", "rule_based_melody"
    ),
    "outFileName": "blah"
  }
}


// Select user-specific path
const mainPath = mainPaths[argv.u]

// Process each football data file
fs.readdirSync(mainPath["inDir"]).forEach(function(file){
  if (path.extname(file) === ".mid"){
    console.log("file:", file)
    const me = new mm.MelodyExtractor(
      path.join(mainPath["inDir"], file)
    )
    const mel = me.extract_melody(mainPath["outDir"])
    // console.log("mel.slice(0, 10):", mel.slice(0, 10))
  }
})



























// ...
