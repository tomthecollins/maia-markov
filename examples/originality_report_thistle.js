// Copyright Tom Collins, 2.3.2020
// Analysing MIDI files to create state-transition matrix and initial
// distribution for melody representations for AI Eurovision 2020 project.

// Individual user paths.
const mainPaths = {
  "tom": {
    "midi": "/Users/tomthecollins/Shizz/York/Projects/AI\ Eurovision/AI\ SONG\ CONTEST\ DATASET/",
    "midiDirs": [ "MIDI" ],
    "testItem": __dirname + "/out/aiev_data_melody/melody_Thistle.mid",
    "genDir": __dirname + "/out/aiev_data_melody/",
    "outputDir": __dirname + "/originality_reports/",
    "outputFileName": "aiev2020_data_melody"
  },
  "anotherUser": {
    // ...
  }
}

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const an = require("./analyze")
const plotlib = require('nodeplotlib')

// Parameters
const targetChannel = 0 // Should be where the melodies are encoded.
const windowOverlapSizes = [
  { "winSize": 16, "overlap": 8 },
  { "winSize": 8, "overlap": 4 },
  { "winSize": 4, "overlap": 2 }
]

// const param = {
//   "stateType": "beat_rel_MNN_state",
//   "onAndOff": false,
//   "nosConsecutives": 4
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

// Load the test item.
const tiMidiData = fs.readFileSync(mainPath["testItem"]);
const tiMidi = new Midi(tiMidiData)
let tiPoints = []
tiMidi.tracks.map(function(track){
  if (track.channel == targetChannel){
    track.notes.map(function(n){
      tiPoints.push([
        n.ticks/tiMidi.header.ppq,
        n.midi,
        n.durationTicks/tiMidi.header.ppq,
        track.channel,
        Math.round(1000*n.velocity)/1000
      ])
    })
  }
})
// console.log("tiPoints.slice(0, 5):", tiPoints.slice(0, 5));
const tiFsm = mu.fifth_steps_mode(tiPoints, mu.krumhansl_and_kessler_key_profiles)
// console.log("tiFsm:", tiFsm)
tiPoints.map(function(p){
  p.splice(2, 0, mu.guess_morphetic(p[1], tiFsm[2], tiFsm[3]))
})
console.log("tiPoints.slice(0, 5):", tiPoints.slice(0, 5));
// let tiComp = an.note_point_set2comp_obj(
//   points, timeSigs, false, [0, 1/4, 1/2, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
// );
// // console.log("comp:", comp);
// // Strip off file extension.
// pFile = pFile.split(".")[0];
// comp["id"] = pFile
// // comp["id"] = uu();
// // comp["idGmd"] = pFile
// comp["name"] = pFile;
// // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
// comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
// pComps.push(comp);


// Import and analyse the MIDI files.
let midiDirs = fs.readdirSync(mainPath["midi"]);
midiDirs = midiDirs.filter(function(midiDir){
  return mainPath["midiDirs"].indexOf(midiDir) >= 0;
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir);
  let pComps = [];
  let pFiles = fs.readdirSync(mainPath["midi"] + midiDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "midi"
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      const midiData = fs.readFileSync(mainPath["midi"] + midiDir + "/" + pFile);
      const midi = new Midi(midiData)
      const timeSigs = [midi.header.timeSignatures.map(function(ts){
        return {
          "barNo": ts.measures + 1,
          "topNo": ts.timeSignature[0],
          "bottomNo": ts.timeSignature[1],
          "ontime": ts.ticks/midi.header.ppq
        }
      })[0]] // SUPER HACKY. REVISE LATER!
      console.log("timeSigs:", timeSigs)
      let points = []
      midi.tracks.map(function(track){
        if (track.channel == targetChannel){
          track.notes.map(function(n){
            points.push([
              n.ticks/midi.header.ppq,
              n.midi,
              n.durationTicks/midi.header.ppq,
              track.channel,
              Math.round(1000*n.velocity)/1000
            ])
          })
        }
      })
      console.log("points.slice(0, 5):", points.slice(0, 5));
      const fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles)
      console.log("fsm:", fsm)
      points.map(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      })
      let comp = an.note_point_set2comp_obj(
        points, timeSigs, false, [0, 1/4, 1/2, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
      );
      // console.log("comp:", comp);
      // Strip off file extension.
      pFile = pFile.split(".")[0];
      comp["id"] = pFile
      // comp["id"] = uu();
      // comp["idGmd"] = pFile
      comp["name"] = pFile;
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      pComps.push(comp);
    }
    catch (e) {
      console.log(e)
    }
  })

  windowOverlapSizes.forEach(function(wo){
    let segs = []
    // pComps.slice(0, 5).forEach(function(c){
    pComps.forEach(function(c){
      const points = mu.comp_obj2note_point_set(c)
      let ontimeInSrc = 0
      let win = wo.winSize
      let overlap = wo.overlap
      let lastOntime = points[points.length - 1][0]

      while (ontimeInSrc < lastOntime){
        let obj = {
          "ontimeInSrc": ontimeInSrc,
          "points": mu.points_belonging_to_interval(points, ontimeInSrc, ontimeInSrc + win),
          "pieceId": c.id
        }
        segs.push(obj)
        ontimeInSrc += overlap
      }
    })
    console.log("segs.length:", segs.length)


    let ontimeInGen = 0
    let genSegmentOntimes = []
    let win = wo.winSize
    let overlap = wo.overlap
    let lastOntime = tiPoints[tiPoints.length - 1][0]
    let maxSimilarities = []
    while (ontimeInGen < lastOntime){
      genSegmentOntimes.push(ontimeInGen)
      let obj = {
        "ontimeInGen": ontimeInGen,
        "maxSimilarity": null,
        "maxPieceId": null,
        "maxPoints": null
      }
      let tiPointsSegment = mu.points_belonging_to_interval(tiPoints, ontimeInGen, ontimeInGen + win)
      console.log("tiPointsSegment:", tiPointsSegment)

      // Calculate the similarities.
      let src = segs.map(function(seg){ return seg.pieceId })
      let cardScores = segs.map(function(seg){
        let cs = 0
        if (seg.points.length > 0 && tiPointsSegment.length > 0){
          cs = mu.cardinality_score(seg.points, tiPointsSegment)
        }
        return cs[0]
      })
      const ma = mu.max_argmax(cardScores)
      obj.maxSimilarity = ma[0]
      obj.maxPieceId = src[ma[1]]
      obj.maxPoints = segs[ma[1]]
      maxSimilarities.push(obj)

      ontimeInGen += overlap
    }
    console.log("maxSimilarities:", maxSimilarities)

    // Plot it.
    let data = [{
      "x": genSegmentOntimes,
      "y": maxSimilarities.map(function(ms){ return ms.maxSimilarity }),
      "type": "line"
    }]
    const layout = { "yaxis": { "range" : [0, 1] } }
    // console.log("data[0]:", data[0])
    plotlib.stack(data, layout)

  })

  plotlib.plot();

  // let pStm = an.construct_stm(pComps, param)
  // // console.log("pStm.length:", pStm.length);
  // pStm = an.prune_stm(pStm, param)
  // // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  // fs.writeFileSync(
  //   mainPath["outputDir"] + mainPath["outputFileName"] + ".js",
  //   // "var perc_" + midiDir + " = " +
  //   JSON.stringify(pStm)//, null, 2)
  //   // + ";"
  // )
  //
  // let pInitialDistbn = an.construct_initial(pComps, param)
  // pInitialDistbn = an.prune_initial(pInitialDistbn, pStm, param)
  // fs.writeFileSync(
  //   mainPath["outputDir"] + mainPath["outputFileName"] + "_initial.js",
  //   // "var perc_" + midiDir + " = " +
  //   JSON.stringify(pInitialDistbn)//, null, 2)
  //   // + ";"
  // )

})
