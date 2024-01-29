// Copyright Tom Collins, 22.5.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for Alex's listening study. Focusing on 3-4 pieces here.

// Individual user paths.
const mainPaths = {
  "tom": {
    "kern": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ (Zongyu)\ Yin/string\ quartets/data/",
    "kernDirs": [ "kern" ],
    "midiDirs": [ "midi" ],
    "outputDir": __dirname + "/stm/",
    "outputFileName": "strq2020_triple"
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
// const mm = require("./../maia-markov")
// const an = require("./analyze")

// Parameters
const param = {
  "stateType": "beat_rel_sq_MNN_state",
  "onAndOff": false,
  "squashRangeMidi": 12,
  "nosConsecutives": 4,
  "phraseBoundaryPropName": "pbo",
  "restDurationForPhraseBoundaries": 1,
  "topNoAllowed": [3]
}
const fn = [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
// Avoid these ids because they were used to select excerpts of human-composed
// material.
const idAvoid = ["1211", "1219", "1240", "1827", "1893", "2322", "2368"]

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
  let pbos = [];
  let pFiles = fs.readdirSync(mainPath["kern"] + kernDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "krn" &&
    idAvoid.indexOf(pFile.split(".")[0]) == -1
  })
  console.log("pFiles.length:", pFiles.length);
  // pFiles.forEach(function(pFile, iFile){
  ////////////
  // TEMP!! //
  ////////////
  pFiles.forEach(function(pFile, iFile){
  // pFiles.slice(0, 5).forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    // if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    // }
    try {
      // if (pFile == "1274.krn"){
        let ki = new mm.KernImport(
          mainPath["kern"] + kernDir + "/" + pFile
        )
        let anc = ki.get_anacrusis()
        console.log("anc:", anc)
        let pbo = ki.get_phrase_boundary_ontimes(anc)
        // console.log("timeIncrArr:", pbo.timeIncrArr)
        console.log("pbo.phraseBgnOntimes.length:", pbo.phraseBgnOntimes.length)
        // console.log("pbo.phraseBgnOntimes.slice(0, 5):", pbo.phraseBgnOntimes.slice(0, 5))
        // console.log("phraseEndOntimes:", pbo.phraseEndOntimes)
        let mi = new mm.MidiImport(
          mainPath["kern"] + mainPath["midiDirs"][jDir] + "/" + pFile.split(".")[0] + ".mid",
          fn,
          anc
        )
        // console.log("mi.points.slice(0, 5):", mi.points.slice(0, 5))
        const pbo2 = mi.get_phrase_boundary_ontimes(param.restDurationForPhraseBoundaries, "offtime")
        console.log("pbo2.length:", pbo2.length)
        // console.log("pbo2.slice(0, 5):", pbo2.slice(0, 5))
        const peo2 = mi.get_phrase_boundary_ontimes(param.restDurationForPhraseBoundaries, "ontime")

        // Does this piece have the appropriate time signature?
        if (param.topNoAllowed.indexOf(mi.timeSigs[0].topNo) >= 0){
          // Yes. Stick the phrase boundary ontimes on to the Composition object
          // so they can be used by an.construct_initial below.
          mi.compObj.pbo = pbo2
          mi.compObj.peo = peo2
          pComps.push(mi.compObj)
        }
      // }
    }
    catch (e) {
      console.log(e)
    }
  });
  console.log("pComps.length:", pComps.length)
  const an = new mm.Analyzer()

  // Construct STM.
  let pStm = an.construct_stm(pComps, param)
  // console.log("pStm.length:", pStm.length);
  pStm = an.prune_stm(pStm, param)
  // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  fs.writeFileSync(
    mainPath["outputDir"] + mainPath["outputFileName"] + ".js",
    // "var perc_" + kernDir + " = " +
    JSON.stringify(pStm)//, null, 2)
    // + ";"
  )

  // Construct inner initial distribution.
  let pInitialDistbn = an.construct_initial(pComps, param)
  pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  fs.writeFileSync(
    mainPath["outputDir"] + mainPath["outputFileName"] + "_initial.js",
    // "var perc_" + kernDir + " = " +
    JSON.stringify(pInitialDistbn)//, null, 2)
    // + ";"
  )

  // Construct inner final distribution.
  param.phraseBoundaryPropName = "peo"
  let pFinalDistbn = an.construct_initial(pComps, param)
  pFinalDistbn = an.prune_initial(pFinalDistbn, pStm, param)
  fs.writeFileSync(
    mainPath["outputDir"] + mainPath["outputFileName"] + "_final.js",
    JSON.stringify(pFinalDistbn)//, null, 2)
  )

})
