// Individual user paths.
var mainPaths = {
  "tom": __dirname + "/",
  "anotherUser": __dirname + "/path/to/folder/of/json,midi,etc/folders/"
};

// Requires.
var fs = require("fs")
var uu = require("uuid/v4")
// var mc = require("midiconvert")

var an = require("./analyze")
// require("./util_server")

// var CompositionModel = require("../server_api/data_api/rdb_model/composition_model");
// var InstrumentModel = require("../server_api/data_api/rdb_model/instrument_model");

// Parameters
var stms = [
  {
    "tag": "Tiny example",
    "dirName": 0,
    "stmPerc": [],
    "stmNonperc": []
  },
  {
    "tag": "Tiny string quartet",
    "dirName": 1,
    "stmPerc": [],
    "stmNonperc": []
  },

];

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
var outdir = mainPath + "stm/";
// fs.mkdir(outdir);

var jsDirs = fs.readdirSync(mainPath + "json/");
jsDirs = jsDirs.filter(function(jsDir){
  return !isNaN(parseInt(jsDir));
})
jsDirs.forEach(function(jsDir, jDir){
  console.log("Working on jsDir:", jsDir, "jDir:", jDir);
  var pComps = [];
  var npComps = [];
  var pFiles = fs.readdirSync(mainPath + "json/" + jsDir + "/perc");
  var npFiles = fs.readdirSync(mainPath + "json/" + jsDir + "/nonperc");
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "json"
  })
  npFiles = npFiles.filter(function (npFile){
    return npFile.split(".")[1] == "json"
  })
  console.log("pFiles.length:", pFiles.length);
  console.log("npFiles.length:", npFiles.length);

  pFiles.forEach(function(pFile, iFile){
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      var pointsStr = fs.readFileSync(mainPath + "json/" + jsDir + "/perc/" + pFile);
      var points = JSON.parse(pointsStr);
      // console.log("points.slice(0, 5):", points.slice(0, 5));
      var comp = an.note_point_set2comp_obj(points, true, 0, 1, 3, 4, 5);
      // console.log("comp:", comp);
      // Strip off file extension.
      pFile = pFile.split(".")[0];
      comp["id"] = uu();
      // comp["idGmd"] = pFile
      comp["name"] = pFile;
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      pComps.push(comp);
    }
    catch (e) {
      console.log(e)
    }
  });
  var pStm = an.construct_stm(pComps, "beat_MNN_state");
  console.log("pStm.length:", pStm.length);
  // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  fs.writeFileSync(
    outdir + jsDir + "_perc.js",
    // "var perc_" + jsDir + " = " +
    JSON.stringify(pStm, null, 2)
    // + ";"
  )

  npFiles.forEach(function(npFile, iFile){
    if (iFile % 10 == 0){
      console.log("!!! NPFILE " + (iFile + 1) + " OF " + npFiles.length + " !!!")
    }
    try {
      var pointsStr = fs.readFileSync(mainPath + "json/" + jsDir + "/nonperc/" + npFile);
      var points = JSON.parse(pointsStr);
      // console.log("points.slice(0, 5):", points.slice(0, 5));
      var comp = an.note_point_set2comp_obj(points, false, 0, 1, 3, 4, 5);
      // console.log("comp:", comp);
      // Strip off file extension.
      npFile = npFile.split(".")[0];
      comp["id"] = uu();
      // comp["idGmd"] = npFile
      comp["name"] = npFile;
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      npComps.push(comp);
    }
    catch (e) {
      console.log(e)
    }
  });
  var npStm = an.construct_stm(npComps, "beat_rel_MNN_state");
  // console.log("npStm[0].beat_mnn_state:", npStm[0].beat_mnn_state);
  // console.log("npStm.slice(0, 1):", npStm.slice(0, 1));
  fs.writeFileSync(
    outdir + jsDir + "_nonperc.js",
    // "var nonperc_" + jsDir + " = " +
    JSON.stringify(npStm, null, 2)
    // + ";"
  )
})
