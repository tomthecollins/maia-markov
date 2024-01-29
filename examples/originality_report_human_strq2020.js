// Copyright Tom Collins, 20.8.2020

// Requires.
const path = require("path")
const fs = require("fs")
const sr = require('seed-random')
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")
const an = require("./analyze")
const plotlib = require('nodeplotlib')

// Parameters
// Individual user paths
const mainPaths = {
  "tom": {
    "midi": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ \(Zongyu\)\ Yin/listening\ study/string\ quartets/data/",
    "midiDirs": [ "midi" ],
    "testItems": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ \(Zongyu\)\ Yin/listening\ study/string\ quartets/data/midi/",
    // "testItem": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ \(Zongyu\)\ Yin/listening\ study/new_magenta_quartet_examples/20200820-002703.mid",
    "outputDir": __dirname + "/originality_reports/",
    // "outputFileName": "um"
  },
  "alex": {
    "midi": path.join(__dirname, "candidates"),
    "midiDirs": [ "midi" ],
    "testItems": path.join(__dirname, "candidates", "midi"),
    "outputDir": path.join(__dirname, "originality_reports"),
    // "outputFileName": "um"
  },
  "anotherUser": {
    // ...
  }
}
// const targetChannel = 0 // Analyzing all channels here.
const holdoutIds = ["1211", "1219", "1240", "1827", "1893", "2322", "2368"]
const windowOverlapSizes = [
  { "winSize": 16, "overlap": 8 },
  // { "winSize": 8, "overlap": 4 },
  // { "winSize": 4, "overlap": 2 }
]
const sampleSize = 50
sr("this is the seed!", {global: true})

// Grab user name from command line to set path to data.
let nextU = false
let mainPath
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    mainPath = mainPaths[arg]
    nextU = false
  }
})
// fs.mkdir(outdir)


// Import and the MIDI files that act as the comparison set.
let pointSets = []
let midiDirs = fs.readdirSync(mainPath["midi"])
console.log("midiDirs:", midiDirs)
midiDirs = midiDirs.filter(function(midiDir){
  return mainPath["midiDirs"].indexOf(midiDir) >= 0
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir)
  let pFiles = fs.readdirSync(path.join(mainPath["midi"], midiDir))
  pFiles = pFiles.filter(function(pFile){
    return (pFile.split(".")[1] === "mid" || pFile.split(".")[1] === "midi")
    && holdoutIds.indexOf(pFile.split(".")[0]) === -1
  })
  console.log("pFiles.length:", pFiles.length)

  pFiles.forEach(function(pFile, iFile){
    console.log("pFile:", pFile)
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    try {
      const midiData = fs.readFileSync(path.join(mainPath["midi"], midiDir, pFile))
      const midi = new Midi(midiData)
      const timeSigs = [midi.header.timeSignatures.map(function(ts){
        return {
          "barNo": ts.measures + 1,
          "topNo": ts.timeSignature[0],
          "bottomNo": ts.timeSignature[1],
          "ontime": ts.ticks / midi.header.ppq
        }
      })[0]] // SUPER HACKY. REVISE LATER!
      console.log("timeSigs:", timeSigs)
      let points = []
      midi.tracks.forEach(function(track){
        // if (track.channel == targetChannel){
        track.notes.forEach(function(n){
          points.push([
            n.ticks / midi.header.ppq,
            n.midi,
            n.durationTicks / midi.header.ppq,
            track.channel,
            Math.round(1000 * n.velocity) / 1000
          ])
        })
        // }
      })
      points = mu.sort_rows(points)[0]
      // console.log("points.slice(0, 50):", points.slice(0, 50))
      const fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles)
      console.log("fsm:", fsm)
      points.forEach(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      })
      // let comp = an.note_point_set2comp_obj(
      //   points, timeSigs, false, [0, 1/4, 1/2, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
      // )
      // console.log("comp:", comp)
      // Strip off file extension.
      pFile = pFile.split(".")[0]
      // comp["id"] = pFile
      // comp["id"] = uu()
      // comp["idGmd"] = pFile
      // comp["name"] = pFile
      // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      // comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      pointSets.push({"id": pFile, "points": points})
    } catch (e){
      console.log(e)
    }
  })
}) // midiDirs.forEach()
console.log("pointSets.length:", pointSets.length)

// Load the test items.
let tiPointSets = []
let tiFiles = fs.readdirSync(mainPath["testItems"])
tiFiles = tiFiles.filter(function(tiFile){
  return (tiFile.split(".")[1] === "mid" || tiFile.split(".")[1] === "midi")
  && holdoutIds.indexOf(tiFile.split(".")[0]) >= 0
})
tiFiles.forEach(function(tiFile, tiFIdx){
  const tiMidiData = fs.readFileSync(path.join(mainPath["testItems"], tiFile))
  const tiMidi = new Midi(tiMidiData)
  let tiPoints = []
  tiMidi.tracks.forEach(function(track){
    // if (track.channel == targetChannel){
    track.notes.forEach(function(n){
      tiPoints.push([
        n.ticks / tiMidi.header.ppq,
        n.midi,
        n.durationTicks / tiMidi.header.ppq,
        track.channel,
        Math.round(1000 * n.velocity) / 1000
      ])
    })
  })
  tiPoints = mu.sort_rows(tiPoints)[0]
  // console.log("tiPoints.slice(0, 50):", tiPoints.slice(0, 50))
  const tiFsm = mu.fifth_steps_mode(tiPoints, mu.krumhansl_and_kessler_key_profiles)
  // console.log("tiFsm:", tiFsm)
  tiPoints.forEach(function(p){
    p.splice(2, 0, mu.guess_morphetic(p[1], tiFsm[2], tiFsm[3]))
  })
  // console.log("tiPoints.slice(0, 5):", tiPoints.slice(0, 5))
  tiPointSets.push(tiPoints)
}) // tiFiles.forEach(
console.log("tiPointSets.length:", tiPointSets.length)

windowOverlapSizes.forEach(function(wo){
  // Form the segments that will go into the cardinality score calculations.
  let segs = []
  // pointSets.slice(0, 5).forEach(function(c){
  pointSets.forEach(function(c){
    const points = c.points
    // const points = mu.comp_obj2note_point_set(c)
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
  let src = segs.map(function(seg){
    return seg.pieceId
  })

  // Form the segments that will go into the cardinality score calculations.
  let allMaxSimilarities = []
  tiFiles.forEach(function(tiFile, tiFIdx){
    let tiPoints = tiPointSets[tiFIdx]
    let ontimeInGen = 0
    // let genSegmentOntimes = []
    let win = wo.winSize
    let overlap = wo.overlap
    let lastOntime = tiPoints[tiPoints.length - 1][0]
    // let maxSimilarities = []
    while (ontimeInGen < lastOntime){
      // console.log("ontimeInGen:", ontimeInGen)
      // console.log("lastOntime:", lastOntime)
      // genSegmentOntimes.push(ontimeInGen)
      let obj = {
        "ontimeInGen": ontimeInGen,
        "idGen": tiFile.split(".")[0],
        "points": null,
        "maxSimilarity": null,
        "maxPieceId": null,
        "maxPoints": null
      }
      obj.points = mu.points_belonging_to_interval(tiPoints, ontimeInGen, ontimeInGen + win)
      // console.log("tiPointsSegment:", tiPointsSegment)
      allMaxSimilarities.push(obj)
      ontimeInGen += overlap
    }
  })

  // Sample from allMaxSimilarities without replacement.
  let sample = mu.sample_without_replacement(allMaxSimilarities, sampleSize)
  // console.log("sample:", sample)
  // Compute similarities.
  sample.forEach(function(obj, idx){
    console.log("Working on sample item " + (idx + 1) + " of " + sample.length + ".")
    let cardScores = segs.map(function(seg){
      let cs = 0
      if (seg.points.length > 0 && obj.points.length > 0){
        const a = mu.unique_rows(
            seg.points.map(function(p){
              return [Math.round(24 * p[0]), p[2]]
            })
        )[0]
        const b = mu.unique_rows(
            obj.points.map(function(p){
              return [Math.round(24 * p[0]), p[2]]
            })
        )[0]
        cs = mu.cardinality_score(a, b)
      }
      return cs[0]
    })
    const ma = mu.max_argmax(cardScores)
    obj.maxSimilarity = ma[0]
    obj.maxPieceId = src[ma[1]]
    obj.maxPoints = segs[ma[1]]
  })
  console.log("sample:", sample)

  const observations = sample.map(function(s){
    return s.maxSimilarity
  })
  console.log("observations:", observations)
  console.log("mu.mean(observations):", mu.mean(observations))
  console.log("mu.std(observations):", mu.std(observations))

}) // windowOverlapSizes.forEach()
