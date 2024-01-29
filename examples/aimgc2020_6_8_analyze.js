// Copyright Tom Collins, 24.9.2020
// Analysing Composition object files to create state-transition matrix and
// initial distribution for the AI Music Generation Challenge 2020.

// Requires
const path = require("path")
const fs = require("fs")
const uu = require("uuid/v4")
const mu = require("maia-util")
const mm = require("./../dist/index")

// Individual user paths
const mainPaths = {
  "tom": {
    "inRoot": path.join("/Users", "tomthecollins", "Shizz", "Data", "Music", "1001"),
    "inDirs": [ "compObj" ],
    "outputDir": path.join(__dirname, "stm"),
    "outputFileName": "aimgc2020_6_8"
  },
  "anotherUser": {
    // ...
  }
}

// Parameters
const param = {
  "stateType": "beat_rel_MNN_state",
  // "stateType": "beat_rel_sq_MNN_state",
  "onAndOff": false,
  // "squashRangeMidi": 12,
  "nosConsecutives": 4,
  // "phraseBoundaryPropName": "pbo",
  "restDurationForPhraseBoundaries": 1,
  "timeSignatureAllowed": [6, 8]
}
const fn = [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
// Avoid these ids because they were used to select excerpts of human-composed
// material.
const idAvoid = ["0035"]

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

// Import and analyse the Composition object files.
let inDirsFilt = fs.readdirSync(mainPath["inRoot"]);
inDirsFilt = inDirsFilt.filter(function(inDir){
  return mainPath["inDirs"].indexOf(inDir) >= 0
})
console.log("inDirsFilt:", inDirsFilt)
inDirsFilt.forEach(function(inDir, jDir){
  console.log("Working on inDir:", inDir, "jDir:", jDir)
  let pComps = [];
  let pbos = [];
  let pFiles = fs.readdirSync(path.join(mainPath["inRoot"], inDir))
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "json" &&
    idAvoid.indexOf(pFile.split(".")[0]) == -1
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
  // pFiles.slice(0, 500).forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    // if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    // }
    try {
      const coData = fs.readFileSync(path.join(mainPath["inRoot"], inDir, pFile))
      const co = JSON.parse(coData)
      co.id = pFile.split(".")[0]
      const points = mu.comp_obj2note_point_set(co)
      console.log("points.slice(0, 3):", points.slice(0, 3))
      const fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles, 1, 3)
      console.log("fsm:", fsm)
      co.keySignatures = [{
        "fifthSteps": fsm[2],
        "mode": fsm[3]
      }]
      // Phrase begin ontimes and phrase end ontimes
      let pbo = [], peo = []
      const segs = mu.segment(points, true, 0, 3)
      segs.forEach(function(seg, idx){
        if (seg.points.length == 0 && seg.offtime - seg.ontime >= param.restDurationForPhraseBoundaries){
          pbo.push(seg.offtime)
          peo.push(seg.ontime)
        }
      })

      // Does this piece have the appropriate time signature?
      console.log("co.timeSignatures[0]:", co.timeSignatures[0])
      console.log("param.timeSignatureAllowed:", param.timeSignatureAllowed)
      if (
        co.timeSignatures.length == 1 &&
        co.timeSignatures[0].topNo === param.timeSignatureAllowed[0] &&
        co.timeSignatures[0].bottomNo === param.timeSignatureAllowed[1]
      ){
        // Yes. Stick the phrase boundary ontimes on to the Composition object
        // so they can be used by an.construct_initial below.
        co.pbo = pbo
        co.peo = peo
        pComps.push(co)
      }
    }
    catch (e) {
      console.log(e)
    }
  });
  console.log("pComps.length:", pComps.length)
  const an = new mm.Analyzer()

  // Construct STM.
  let pStm = an.construct_stm(pComps, param)
  console.log("pStm.length:", pStm.length)
  // for (let k = 0; k < 10; k++){
  //   console.log("pStm[k]:", pStm[k])
  //   console.log("pStm[k].continuations:", pStm[k].continuations)
  // }
  pStm = an.prune_stm(pStm, param)
  console.log("pStm.length after pruning:", pStm.length)
  // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  fs.writeFileSync(
    path.join(mainPath["outputDir"], mainPath["outputFileName"] + ".js"),
    // "var perc_" + kernDir + " = " +
    JSON.stringify(pStm)//, null, 2)
    // + ";"
  )

  // Construct inner and final distributions.
  let pInitialDistbn = [], pFinalDistbn = []
  pComps.forEach(function(co){
    let scp = an.comp_obj2beat_rel_mnn_states(co, param.onAndOff)
    if (scp.length > 0){
      pInitialDistbn.push(scp[0])
      pFinalDistbn.push(scp[scp.length - 1])
    }
  })
  pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  fs.writeFileSync(
    path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_initial.js"),
    JSON.stringify(pInitialDistbn)//, null, 2
  )
  pFinalDistbn = an.prune_initial(pFinalDistbn, pStm, param)
  fs.writeFileSync(
    path.join(mainPath["outputDir"], mainPath["outputFileName"] + "_final.js"),
    JSON.stringify(pFinalDistbn)//, null, 2)
  )

})
