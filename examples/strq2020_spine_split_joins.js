// Copyright Tom Collins, 22.5.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for Alex's listening study.

// Individual user paths.
const mainPaths = {
  "tom": {
    "kern": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ (Zongyu)\ Yin/string\ quartets/data/",
    "kernDirs": [ "kern" ],
    "outputDir": __dirname + "/stm/",
    "outputFileName": "strq2020_duple"
  },
  "anotherUser": {
    // ...
  }
}

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
// const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const mm = require("./../dist/index")
// const an = require("./analyze")

// Parameters
// const param = {
//   "stateType": "beat_rel_sq_MNN_state",
//   "onAndOff": false,
//   "squashRangeMidi": 12,
//   "nosConsecutives": 4,
//   "topNoAllowed": [2, 4]
// }

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
let kernDirs = fs.readdirSync(mainPath["kern"]);
kernDirs = kernDirs.filter(function(kernDir){
  return mainPath["kernDirs"].indexOf(kernDir) >= 0;
})
console.log("kernDirs:", kernDirs)
kernDirs.forEach(function(kernDir, jDir){
  console.log("Working on kernDir:", kernDir, "jDir:", jDir);
  let pComps = [];
  let pFiles = fs.readdirSync(mainPath["kern"] + kernDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "krn"
  })
  console.log("pFiles.length:", pFiles.length);
  pFiles.forEach(function(pFile, iFile){
  // pFiles.slice(0, 5).forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      const krnImp = new mm.KernImport(mainPath["kern"] + kernDir + "/" + pFile, "utf8")
      const fdi = krnImp.get_first_duration_index()
      console.log("fdi:", fdi)
      const fnbi = krnImp.get_first_numbered_bar_and_index()
      console.log("fnbi:", fnbi)
      const fts = krnImp.get_first_time_signature()
      console.log("fts:", fts)
      const a = krnImp.get_anacrusis()
      console.log("a:", a)



      // const kernData = fs.readFileSync(mainPath["kern"] + kernDir + "/" + pFile, "utf8");
      // const lines = kernData.split("\n")
      // console.log("lines.slice(0, 30):", lines.slice(0, 30))
      // Find **kern.
      let i = 0
      let kernIdx
      let line
      while(i < krnImp.lines.length && kernIdx == undefined){
      // while(i < 50 && kernIdx == undefined){
        // console.log("lines[i]:", lines[i])
        // Split this line according to the presence of **kern.
        if (krnImp.lines[i].indexOf("**kern") == 0){
          line = krnImp.lines[i].split("**kern")
          kernIdx = i
          i = krnImp.lines.length - 1
        }
        i++
      }
      console.log("line:", line)
      if (line == undefined){
        console.log("COULD NOT FIND START OF KERN SPINES. RETURNING EARLY!")
        return
      }

      // Look for any instance of ^ (spine split).
      i = kernIdx
      while(i < krnImp.lines.length){
      // while(i < 100){
        if (krnImp.lines[i].indexOf("^") >= 0){
          console.log("i:", i)
          console.log("krnImp.lines[i]:", krnImp.lines[i])
          i = krnImp.lines.length - 1
        }
        i++
      }
    }
    catch (e) {
      console.log(e)
    }
  });
})
