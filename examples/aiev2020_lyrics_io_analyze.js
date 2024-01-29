// Copyright Tom Collins, 2.3.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for lyric excerpts for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "lyrics": "/Users/tomthecollins/Shizz/Data/Music/imogen_heap/",
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
  "stateType": "lyrics_state",
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

// Import and analyse the text files.
let lyrDirs = fs.readdirSync(mainPath["lyrics"]);
lyrDirs = lyrDirs.filter(function(lyrDir){
  return lyrDir == "lyrics";
})
console.log("lyrDirs:", lyrDirs)
lyrDirs.forEach(function(lyrDir, jDir){
  console.log("Working on lyrDir:", lyrDir, "jDir:", jDir);
  let pComps = [];
  let pFiles = fs.readdirSync(mainPath["lyrics"] + lyrDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "txt"
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      let comp = {}
      // Strip off file extension.
      pFile = pFile.split(".")[0];
      comp["id"] = pFile
      comp["name"] = pFile
      const str = fs.readFileSync(mainPath["lyrics"] + lyrDir + "/" + pFile + ".txt", "utf8")
      console.log(str.slice(0, 100))
      comp.lyricsArr = an.string2lyrics(str)
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
    mainPath["outputDir"] + "heap_" + lyrDir + ".js",
    JSON.stringify(pStm)//, null, 2)
  )

  let pInitialDistbn = an.construct_initial(pComps, param)
  pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  fs.writeFileSync(
    mainPath["outputDir"] + "heap_" + lyrDir + "_initial.js",
    JSON.stringify(pInitialDistbn)//, null, 2)
  )

})
