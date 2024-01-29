// Copyright Tom Collins, 24.9.2020
// Generating material for https://boblsturm.github.io/aimusic2020/.

// Requires
const path = require("path")
const fs = require("fs")
const sr = require('seed-random')
const { Midi } = require('@tonejs/midi')
const mu = require('maia-util')
const mm = require("./../dist/index")

// Individual user paths
const mainPaths = {
  "tom": {
    "stm": path.join(__dirname, "stm", "aimgc2020_6_8.js"),
    "initial": path.join(__dirname, "stm", "aimgc2020_6_8_initial.js"),
    "final": path.join(__dirname, "stm", "aimgc2020_6_8_final.js"),
    "outputDir": path.join(__dirname, "out", "aimgc2020_6_8"),
    "outputBin": path.join(__dirname, "out", "aimgc2020_6_8_bin")
  },
  "anotherUser": {
    "stm": "",
    "initial": "",
    "outputDir": ""
  }
}

// Set up parameters.
let param = {
  "stateType": "beat_rel_MNN_state",
  // "stateType": "beat_rel_sq_MNN_state",
  "pointReconstruction": "rel_MNN",
  // "pointReconstruction": "rel_sq_MNN",
  "timeSignatures": [ {"barNo": 1, "topNo": 6, "bottomNo": 8, "ontime": 0} ],
  "stm": null,
  "graph": null,
  "initial": null,
  "final": null,
  "nosConsecutives": 4,
  "ontimeUpperLimit": null,
  "beatHistGranularity": 4,
  // "squashRangeMidiMorph": [12, 7],
  "indices": {
    "ontime": 0, "MNN": 1, "MPN": 2, "duration": 3, "channel": 4, "velocity": 5
  },
  "randCount": 0,
  "nosGenerate": 17500,
  "nosOutput": 8750,
  "nosOutputBin": 5
}
let seeds = []
for (let i = 0; i < param.nosGenerate; i++){
  seeds.push(i.toString())
}
// console.log("seeds:", seeds)
let repetitiveStructures = [
  // 1. Repetitive structure of "Money in both pockets".
  // D1---    D2---
  // B1    B2 C1 C2 B3 C3
  // A1 A2
  [
    {// 0
      "label": "A1",
      "ontimeBgn": 0,
      "ontimeEnd": 6,
      "subsetScore": 1
    },
    {// 1
      "label": "null",
      "ontimeBgn": 6,
      "ontimeEnd": 12,
      "subsetScore": null
    },
    {// 2
      "label": "A2",
      "ontimeBgn": 12,
      "ontimeEnd": 18,
      "subsetScore": 1
    },
    {// 3
      "label": "null",
      "ontimeBgn": 18,
      "ontimeEnd": 24,
      "subsetScore": null
    },
    {// 4
      "label": "A3",
      "ontimeBgn": 24,
      "ontimeEnd": 30,
      "subsetScore": 1
    },
    {// 5
      "label": "null",
      "ontimeBgn": 30,
      "ontimeEnd": 36,
      "subsetScore": null
    },
    {// 6
      "label": "A4",
      "ontimeBgn": 36,
      "ontimeEnd": 42,
      "subsetScore": 1
    },
    {// 7
      "label": "null",
      "ontimeBgn": 42,
      "ontimeEnd": 48,
      "subsetScore": null
    },
    {// 8
      "label": "C1",
      "ontimeBgn": 48,
      "ontimeEnd": 72,
      "subsetScore": 0
    },
    {// 9
      "label": "C2",
      "ontimeBgn": 72,
      "ontimeEnd": 96,
      "subsetScore": 0
    },
    { // 10
      "label": "A5",
      "ontimeBgn": 96,
      "ontimeEnd": 102,
      "subsetScore": 1
    },
    {// 11
      "label": "null",
      "ontimeBgn": 102,
      "ontimeEnd": 108,
      "subsetScore": null
    },
    {// 12
      "label": "A6",
      "ontimeBgn": 108,
      "ontimeEnd": 114,
      "subsetScore": 1
    },
    {// 13
      "label": "null",
      "ontimeBgn": 114,
      "ontimeEnd": 120,
      "subsetScore": null
    },
    {// 14
      "label": "C3",
      "ontimeBgn": 120,
      "ontimeEnd": 144,
      "subsetScore": 0
    },
  ],
  // 2. Repetitive structure of ?
  [

  ]
]


// Grab user name from command line to set path to data.
let nextU = false
let pathsEtc;
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    pathsEtc = mainPaths[arg]
    nextU = false
  }
})
// fs.mkdir(outdir);

const an = new mm.Analyzer()
const gn = new mm.Generator()
const pg = new mm.PatternGenerator()

const stmStr = fs.readFileSync(pathsEtc.stm)
param.stm = JSON.parse(stmStr)
const initialStr = fs.readFileSync(pathsEtc.initial)
param.initial = JSON.parse(initialStr)
const finalStr = fs.readFileSync(pathsEtc.final)
param.final = JSON.parse(finalStr)


// Helper functions for rating output.
function beat_histogram(
  aPointSet, beatsInMeasure = 4, granularity = 4, showTF = false
){
  var hist = []
  for (var i = 0; i < beatsInMeasure*granularity; i++){
    hist[i] = 0
  }
  aPointSet.forEach(function(p, idx){
    var intPart = parseInt(p[0])
    var decPart = p[0] - intPart
    var beat = intPart % beatsInMeasure + decPart
    var histIdx = Math.floor(granularity*beat)
    hist[histIdx]++
  })
  if (showTF){
    console.log('hist:', hist)
  }
  return hist
}

function normalise_array(anArray){
  const s = mu.array_sum(anArray)
  return anArray.map(function(a){
    return a/s
  })
}

function entropy(aDist){
  return mu.array_sum(aDist.map(function(p){
    if (p == 0){
      return 0
    }
    return -p*Math.log2(p)
  }))
}

function duration_of_rests(aPointSet, ontimeUpperLimit){
  const segs = mu.segment(aPointSet)
  let dur = 0
  segs.forEach(function(seg){
    if (seg.points.length == 0){
      dur += seg.offtime - seg.ontime
    }
  })
  if (segs[segs.length - 1].offtime < ontimeUpperLimit){
    dur += ontimeUpperLimit - segs[segs.length - 1].offtime
  }
  return dur
}

function tonal_ambiguity(aPointSet){
  const fsm = mu.fifth_steps_mode(
    aPointSet,
    mu.krumhansl_and_kessler_key_profiles, 1, 3
  )
  return 1 - Math.abs(fsm[1])
}


let seedMetrics = seeds.map(function(seed, idx){
  if (idx % 500 === 0){
    console.log("Generating " + (idx + 1) + " of " + seeds.length + ".")
  }

  sr(seed, {global: true})
  // Refresh win definition.
  let win = JSON.parse(JSON.stringify(repetitiveStructures[0]))

  // Still to implement Lisp code for pattern inheritance in JS.
  // Handling occurrences of A.
  param.ontimeUpperLimit = win[0].ontimeEnd
  win[0].gen = gn.get_suggestion(param)
  win[0].scp = win[0].gen.stateContextPairs
  // Copy to wins 2, 4, 6, 10, and 12.
  let arr = [2, 4, 6, 10, 12]
  arr.forEach(function(idx){
    win[idx].scp = JSON.parse(JSON.stringify(win[0].scp))
  })

  // Handling occurrences of B.
  // B1 contains A1 and A2, so fill in gaps which are at 6-12 and 18-24, then
  // paste to corresponding locations in B2 and B3.
  // 6-12
  param.ontimeUpperLimit = win[1].ontimeEnd - win[1].ontimeBgn
  let nPairs = win[0].scp.length
  if (nPairs > 0){
    param.initial = win[0].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[1].gen = gn.get_suggestion(param)
  win[1].scp = win[1].gen.stateContextPairs.slice(1)
  // 18-24
  param.ontimeUpperLimit = win[3].ontimeEnd - win[3].ontimeBgn
  nPairs = win[2].scp.length
  if (nPairs > 0){
    param.initial = win[2].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[3].gen = gn.get_suggestion(param)
  win[3].scp = win[3].gen.stateContextPairs.slice(1)
  // Paste.
  // Copy to win[1] to wins 5 and 11.
  arr = [5, 11]
  arr.forEach(function(idx){
    win[idx].scp = JSON.parse(JSON.stringify(win[1].scp))
  })
  // Copy to win[3] to wins 7 and 13.
  arr = [7, 13]
  arr.forEach(function(idx){
    win[idx].scp = JSON.parse(JSON.stringify(win[3].scp))
  })

  // Handling occurrences of C.
  param.ontimeUpperLimit = win[8].ontimeEnd - win[8].ontimeBgn
  nPairs = win[7].scp.length
  if (nPairs > 0){
    param.initial = win[7].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[8].gen = gn.get_suggestion(param)
  win[8].scp = win[8].gen.stateContextPairs.slice(1)
  // Copy to win[8] to wins 9 and 14.
  arr = [9, 14]
  arr.forEach(function(idx){
    win[idx].scp = JSON.parse(JSON.stringify(win[8].scp))
  })

  // Concatenate scp properties.
  let scp = []
  win.forEach(function(w, idx){
    if (w.scp !== undefined){
      scp = scp.concat(w.scp)
    }
  })
  // console.log("scp:", scp)

  // Reinstate full initial distribution.
  param.initial = JSON.parse(initialStr)
  let points = gn.get_points_from_states(scp, param)
  const mnnShift = win[0].scp[0].context.tonic_pitch_closest[0]
  const mpnShift = win[0].scp[0].context.tonic_pitch_closest[1]
  points.forEach(function(p){
    // p[param.indices.ontime] += w.ontimeBgn
    p[param.indices.MNN] += mnnShift
    p[param.indices.MPN] += mnnShift
  })
  // console.log("points:", points)

  // Calculate metrics.
  const prop = duration_of_rests(points, win[win.length - 1].ontimeEnd)/
  win[win.length - 1].ontimeEnd
  const ta = tonal_ambiguity(points)
  const bh = beat_histogram(points, param.timeSignatures[0].topNo, param.beatHistGranularity)
  const en = entropy(normalise_array(bh))
  return {
    "seed": seed,
    "points": points,
    "proportionOfRests": prop,
    "tonalAmbiguity": ta,
    "beatHistEntropy": en,
    "empiricalHeuristic": prop*ta*en
  }

})

// Sort by empirically-inspired heuristics.
seedMetrics = seedMetrics.sort(function(a, b){
  return a.empiricalHeuristic - b.empiricalHeuristic
})
console.log("seedMetrics.slice(0, 3):", seedMetrics.slice(0, 3))
console.log("seedMetrics.slice(seeds.length - 3):", seedMetrics.slice(seeds.length - 3))


function points2midi(pts, thePath, sf = 1){
  let ontimeCorrection = 0
  const minOntime = mu.min_argmin(pts.map(function(p){ return p[param.indices.ontime] }))[0]
  if (minOntime < 0){
    ontimeCorrection = 4*param.timeSignatures[0].topNo/param.timeSignatures[0].bottomNo
  }
  let midi = new Midi()
  // "Works" but actually changes nothing!:
  // midi.header.setTempo(240)
  // console.log("midi.header:", midi.header)
  let track = midi.addTrack()
  pts.forEach(function(p){
    track.addNote({
      midi: p[param.indices.MNN],
      time: sf*(p[param.indices.ontime] + ontimeCorrection),
      duration: sf*p[param.indices.duration],
      velocity: p[param.indices.velocity]
    })
  })
  fs.writeFileSync(
    thePath,
    new Buffer(midi.toArray())
  )
}

// Convert "best-performing" excerpts to MIDI.
const scaleFactor = 0.5
for (let i = 0; i < param.nosOutput; i++){
  points2midi(
    seedMetrics[i].points,
    path.join(pathsEtc.outputDir, (i + 1) + ".mid"),
    scaleFactor
  )
}
// Convert "worst-performing" excerpts to MIDI.
for (let i = param.nosGenerate - param.nosOutputBin; i < param.nosGenerate; i++){
  points2midi(
    seedMetrics[i].points,
    path.join(pathsEtc.outputBin, (i + 1) + ".mid"),
    scaleFactor
  )
}
