// Copyright Tom Collins, 26.5.2020
// Having a look at loading on to a Graph class and using shortest path.

// Individual user paths.
const mainPaths = {
  "tom": {
    "stm": __dirname + "/stm/strq2020_duple.js",
    "initial": __dirname + "/stm/strq2020_duple_initial.js",
    "final": __dirname + "/stm/strq2020_duple_final.js",
    "outputDir": __dirname + "/out/strq2020_duple/"
  },
  "anotherUser": {
    "stm": "",
    "initial": "",
    "outputDir": ""
  }
}

// Requires.
const fs = require("fs")
const sr = require('seed-random')
const { Midi } = require('@tonejs/midi')
// const gn = require("./generate")
// const an = require("./analyze")
const mu = require('maia-util')
const mm = require("./../dist/index")


// Set up parameters.
let seeds = [
  [
    "Almond", "Birch", "Chestnut", "Cress", "Daisy", "Elderberry", "Fennel", "Flax", "Garlic", "Holly", "Ivy", "Juniper", "Kudzu", "Lilac", "Maple", "Moosewood", "Nightshade", "Olive", "Pear", "Quercitron", "Rose", "Snowdrop", "Sunflower", "Tea", "Thistle", "Violet", "Walnut", "Willow", "Yarrow", "Zebrawood"
  ],
  [
    "Alligator", "Armadillo", "Bee", "Butterfly", "Cat", "Chameleon", "Dove", "Dragonfly", "Elephant", "Firefly", "Gopher", "Hippopotamus", "Hummingbird", "Iguana", "Jay", "Leopard", "Lion", "Lynx", "Magpie", "Mosquito", "Nightingale", "Orangutan", "Orca", "Peacock", "Slug", "Tiger", "Toad", "Tortoise", "Whale", "Zebra"
  ]
]
let param = {
  "stateType": "beat_rel_sq_MNN_state",
  "pointReconstruction": "rel_sq_MNN",
  "timeSignatures": [ {"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0} ],
  "stm": null,
  "graph": null,
  "initial": null,
  "final": null,
  "nosConsecutives": 4,
  "nosCandidates": 1,
  "ontimeUpperLimit": null,
  "beatHistGranularity": 4,
  "squashRangeMidiMorph": [12, 7],
  "indices": {
    "ontime": 0, "MNN": 1, "MPN": 2, "duration": 3, "channel": 4, "velocity": 5
  },
  "randCount": 0
}
let repetitiveStructures = [
  // 1. Let's say the first 4 bars are repeated in bars 5-9, and then the excerpt
  // proceeds without further repetitions.
  [
    {
      "label": "A1",
      "ontimeBgn": 0,
      "ontimeEnd": 16
    },
    {
      "label": "A2",
      "ontimeBgn": 16,
      "ontimeEnd": 32
    },
    {
      "label": null,
      "ontimeBgn": 32,
      "ontimeEnd": 60
    }
  ],
  // 2. Let's say we have ABABCA.
  [
    {
      "label": "A1",
      "ontimeBgn": 0,
      "ontimeEnd": 8
    },
    {
      "label": "B1",
      "ontimeBgn": 8,
      "ontimeEnd": 16
    },
    {
      "label": "A2",
      "ontimeBgn": 16,
      "ontimeEnd": 24
    },
    {
      "label": "B2",
      "ontimeBgn": 24,
      "ontimeEnd": 32
    },
    {
      "label": null,
      "ontimeBgn": 32,
      "ontimeEnd": 40
    },
    {
      "label": "A3",
      "ontimeBgn": 40,
      "ontimeEnd": 48
    },
    {
      "label": null,
      "ontimeBgn": 48,
      "ontimeEnd": 60
    },
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


let seedMetrics = seeds[0].map(function(seed){

  sr(seed, {global: true})
  // Refresh win definition.
  let win = JSON.parse(JSON.stringify(repetitiveStructures[0]))

  // Still to implement Lisp code for pattern inheritance in JS.
  param.ontimeUpperLimit = win[0].ontimeEnd
  win[0].gen = gn.get_suggestion(param)
  win[0].scp = win[0].gen.stateContextPairs
  // Copy to win[1].
  win[1].scp = JSON.parse(JSON.stringify(win[0].scp))

  param.ontimeUpperLimit = win[2].ontimeEnd - win[2].ontimeBgn
  let nPairs = win[1].scp.length
  if (nPairs > 0){
    param.initial = win[1].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[2].gen = gn.get_suggestion(param)
  win[2].scp = win[2].gen.stateContextPairs.slice(1)
  // console.log("win:", win)

  // Concatenate scp properties.
  let scp = []
  win.forEach(function(w){
    scp = scp.concat(w.scp)
  })
  // console.log("scp:", scp)

  // Reinstate full initial distribution.
  param.initial = JSON.parse(initialStr)
  let points = gn.get_points_from_states(scp, param)
  const mnnShift = win[0].scp[0].context.tonic_pitch_closest[0]
  const mpnShift = win[0].scp[0].context.tonic_pitch_closest[1]
  points.map(function(p){
    // p[param.indices.ontime] += w.ontimeBgn
    p[param.indices.MNN] += mnnShift
    p[param.indices.MPN] += mnnShift
  })
  // console.log("points:", points)

  // let pg = new mm.PatternGenerator()
  // const stuff = pg.generate(30, param)
  // console.log("stuff.psMetrics[25].pointSet:", stuff.psMetrics[25].pointSet)
  //
  // const points = stuff.psMetrics[25].pointSet.map(function(p){
  //   p[param.indices.MNN] += stuff.psMetrics[25].stateCtxPairs[0].context
  //   .tonic_pitch_closest[0] //60
  //   p[param.indices.MPN] += stuff.psMetrics[25].stateCtxPairs[0].context
  //   .tonic_pitch_closest[1] //60
  //   return p
  // })
  // console.log("points:", points)

  // Save points as a MIDI file and state-context pairs as a text file.
  const sf = 0.5
  let midi = new Midi()
  // "Works" but actually changes nothing!:
  // midi.header.setTempo(240)
  // console.log("midi.header:", midi.header)
  let track = midi.addTrack()
  points.forEach(function(p){
    track.addNote({
      midi: p[param.indices.MNN],
      time: sf*p[param.indices.ontime],
      duration: sf*p[param.indices.duration],
      velocity: p[param.indices.velocity]
    })
  })
  fs.writeFileSync(
    pathsEtc.outputDir + seed + ".mid",
    new Buffer(midi.toArray())
  )

  const prop = duration_of_rests(points, win[win.length - 1].ontimeEnd)/
  win[win.length - 1].ontimeEnd
  const ta = tonal_ambiguity(points)
  const bh = beat_histogram(points, param.timeSignatures[0].topNo, param.beatHistGranularity)
  const en = entropy(normalise_array(bh))
  return { "seed": seed, "proportionOfRests": prop, "tonalAmbiguity": ta, "beatHistEntropy": en }

})

console.log("seedMetrics:", seedMetrics.sort(function(a, b){
  return a.proportionOfRests*a.tonalAmbiguity*a.beatHistEntropy
  - b.proportionOfRests*b.tonalAmbiguity*b.beatHistEntropy
}))


seedMetrics = seeds[1].map(function(seed){

  sr(seed, {global: true})
  // Refresh win definition.
  let win = JSON.parse(JSON.stringify(repetitiveStructures[1]))

  // Still to implement Lisp code for pattern inheritance in JS.
  // A.
  param.ontimeUpperLimit = win[0].ontimeEnd
  win[0].gen = gn.get_suggestion(param)
  win[0].scp = win[0].gen.stateContextPairs
  // Copy to win[2].
  win[2].scp = JSON.parse(JSON.stringify(win[0].scp))
  // Copy to win[5].
  win[5].scp = JSON.parse(JSON.stringify(win[0].scp))

  // B.
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
  // Copy to win[3].
  win[3].scp = JSON.parse(JSON.stringify(win[1].scp))

  // nulls.
  param.ontimeUpperLimit = win[4].ontimeEnd - win[4].ontimeBgn
  nPairs = win[3].scp.length
  if (nPairs > 0){
    param.initial = win[3].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[4].gen = gn.get_suggestion(param)
  win[4].scp = win[4].gen.stateContextPairs.slice(1)

  param.ontimeUpperLimit = win[6].ontimeEnd - win[6].ontimeBgn
  nPairs = win[5].scp.length
  if (nPairs > 0){
    param.initial = win[5].scp[nPairs - 1]
  }
  else {
    param.initial = JSON.parse(initialStr)
  }
  win[6].gen = gn.get_suggestion(param)
  win[6].scp = win[6].gen.stateContextPairs.slice(1)

  // Concatenate scp properties.
  let scp = []
  win.forEach(function(w){
    scp = scp.concat(w.scp)
  })
  // console.log("scp:", scp)

  // Reinstate full initial distribution.
  param.initial = JSON.parse(initialStr)
  let points = gn.get_points_from_states(scp, param)
  const mnnShift = win[0].scp[0].context.tonic_pitch_closest[0]
  const mpnShift = win[0].scp[0].context.tonic_pitch_closest[1]
  points.map(function(p){
    // p[param.indices.ontime] += w.ontimeBgn
    p[param.indices.MNN] += mnnShift
    p[param.indices.MPN] += mnnShift
  })
  // console.log("points:", points)

  // Save points as a MIDI file and state-context pairs as a text file.
  const sf = 0.5
  let midi = new Midi()
  let track = midi.addTrack()
  points.forEach(function(p){
    track.addNote({
      midi: p[param.indices.MNN],
      time: sf*p[param.indices.ontime],
      duration: sf*p[param.indices.duration],
      velocity: p[param.indices.velocity]
    })
  })
  fs.writeFileSync(
    pathsEtc.outputDir + seed + ".mid",
    new Buffer(midi.toArray())
  )

  const prop = duration_of_rests(points, win[win.length - 1].ontimeEnd)/
  win[win.length - 1].ontimeEnd
  const ta = tonal_ambiguity(points)
  const bh = beat_histogram(points, param.timeSignatures[0].topNo, param.beatHistGranularity)
  const en = entropy(normalise_array(bh))
  return { "seed": seed, "proportionOfRests": prop, "tonalAmbiguity": ta, "beatHistEntropy": en }

})

console.log("seedMetrics:", seedMetrics.sort(function(a, b){
  return a.proportionOfRests*a.tonalAmbiguity*a.beatHistEntropy
  - b.proportionOfRests*b.tonalAmbiguity*b.beatHistEntropy
}))






















// console.log("param.stm[0].beat_rel_sq_MNN_state:", param.stm[0].beat_rel_sq_MNN_state)
// console.log("param.stm[0].continuations:", param.stm[0].continuations)
// const exampleState = param.stm[0].beat_rel_sq_MNN_state
// console.log("an.state2string(exampleState):", an.state2string(exampleState))
// let readyForGraph = param.stm.map(function(scPair, idx){
//   // if (idx % 100 == 0){
//   //   console.log("On state " + idx + " of " + param.stm.length + ".")
//   // }
//   const s = an.state2string(scPair.beat_rel_sq_MNN_state)
//   const cs = mu.get_unique(
//     scPair.continuations.map(function(c){
//       return an.state2string(c.beat_rel_sq_MNN_state)
//     })
//     .map(function(c){
//       return { "state": c }
//     })
//   )
//   return { "state": s, "continuations": cs }
// })
// // console.log("readyForGraph.slice(0, 10):", readyForGraph.slice(0, 10))
// param.graph = new mm.Graph(readyForGraph, "state", "continuations")

// const seed = seeds[9]
// sr(seed, {global: true})
// const initialScPair = mu.choose_one(param.initial)
// const initialState = initialScPair[param.stateType]
// const initialStateStr = an.state2string(initialState)
// console.log("initialState:", initialState)
//
// const finalState = mu.choose_one(param.final).beat_rel_sq_MNN_state
// const finalStateStr = an.state2string(finalState)
// console.log("finalState:", finalState)
//
// const path = param.graph.print_shortest_path(initialStateStr, finalStateStr)
// console.log("path:", path)
// let sthg = an.string2state(path[1])
// console.log("sthg:", sthg)



//
// const preferredIdx = 0
// win[0].gen = pg.generate(param.nosCandidates, param)
// win[0].scp = win[0].gen.psMetrics[preferredIdx].stateCtxPairs
// // Copy to win[2].
// win[2].scp = JSON.parse(JSON.stringify(win[0].scp))
//
// win[1].gen = pg.generate(param.nosCandidates, param)
// win[1].scp = win[1].gen.psMetrics[preferredIdx].stateCtxPairs
// // Copy to win[3].
// win[3].scp = JSON.parse(JSON.stringify(win[1].scp))
//
// let nPairs = win[1].gen.psMetrics[preferredIdx].stateCtxPairs.length
// param.initial = win[1].gen.psMetrics[preferredIdx].stateCtxPairs[nPairs - 1]
// win[4].gen = gn.get_suggestion(param)
// win[4].scp = win[4].gen.stateContextPairs.slice(1)
// // console.log("win:", win)
// // Concatenate scp properties.
// let scp = []
// win.forEach(function(w){
//   scp = scp.concat(w.scp)
// })
// // console.log("scp:", scp)


// Reconstruct state-context pairs.
// let scPairs = [initialScPair]
// for (let i = 1; i < path.length; i++){
//   const stateProbe = scPairs[i - 1][param.stateType]
//   const relIdx = mu.array_object_index_of_array(param.stm, stateProbe, param.stateType)
//   // console.log('relIdx:', relIdx)
//   const contProbe = an.string2state(path[i])
//   const relConts = param.stm[relIdx].continuations.filter(function(c){
//     return c[param.stateType].equals(contProbe)
//   })
//   // console.log('relConts:', relConts)
//   if (relConts.length == 0){
//     console.log("ERROR! THERE SHOULD BE AT LEAST ONE!")
//     return
//   }
//   scPairs[i] = mu.choose_one(relConts)
// }
// console.log("scPairs:", scPairs)
//
// let points = gn.get_points_from_states(scPairs, param)
//
//
// points = points.map(function(p){
//   p[param.indices.MNN] += scPairs[0].context
//   .tonic_pitch_closest[0] //60
//   p[param.indices.MPN] += scPairs[0].context
//   .tonic_pitch_closest[1] //60
//   return p
// })
// console.log("points:", points)
//
//














// var relIdx = mu.array_object_index_of_array(param.stm, initialState, "beat_rel_sq_MNN_state")
// console.log('relIdx:', relIdx);
// console.log(
//   "param.stm[relIdx].continuations[0].beat_rel_sq_MNN_state:",
//   param.stm[relIdx].continuations[0].beat_rel_sq_MNN_state
// )
// console.log("g.print_neighbors('1|-12,3'):", g.print_neighbors('1|-12,3'))

// const someState = an.state2string(mu.choose_one(param.stm).beat_rel_sq_MNN_state)
// console.log("someState:", someState)
// const someState2 = an.state2string(mu.choose_one(param.stm).beat_rel_sq_MNN_state)
// console.log("someState2:", someState2)
// const path = g.print_shortest_path(initialStateStr, someState)
// console.log("path:", path)
// let sthg = an.string2state(path[1])
// console.log("sthg:", sthg)


// Seed random number generation.
// sr('christianeriksen', {global: true}); // Overrides global Math.random.
// var numA = Math.random();
// console.log(numA);
// sr.resetGlobal();// Reset to default Math.random.

// seeds.map(function(seed){
//   // Seed random number generation.
//   sr(seed, {global: true})
//   // Reset randCount, then generate states and points.
//   param.randCount = 0
//   console.log("randCount before get_abs_suggestion:", param.randCount)
//   var gendOutput = gn.get_suggestion(param)
//   console.log("randCount after get_abs_suggestion:", gendOutput.randCount)
//   // console.log("gendOutput.points:", gendOutput.points)
//
//   // Convert points to a key according to the initial state.
//   gendOutput.points = gendOutput.points.map(function(p){
//     p[param.indices.MNN] += gendOutput.stateContextPairs[0].context
//     .tonic_pitch_closest[0] //60
//     p[param.indices.MPN] += gendOutput.stateContextPairs[0].context
//     .tonic_pitch_closest[1] //60
//     return p
//   })
//
//   // Save points as a MIDI file and state-context pairs as a text file.
//   let midi = new Midi()
//   console.log("midi.header:", midi.header)
//   let track = midi.addTrack()
//   gendOutput.points.map(function(p){
//     track.addNote({
//       midi: p[param.indices.MNN],
//       time: p[param.indices.ontime],
//       duration: p[param.indices.duration],
//       velocity: p[param.indices.velocity]
//     })
//   })
//   fs.writeFileSync(
//     pathsEtc.outputDir + seed + ".mid",
//     new Buffer(midi.toArray())
//   )
//   // track.notes = track.notes.map(function(n){
//   //   n.time *= 0.5
//   //   n.duration *= 0.5
//   //   return n
//   // })
//   // fs.writeFileSync(
//   //   pathsEtc.outputDir + "chords_" + seed + "_ableton.mid",
//   //   new Buffer(midi.toArray())
//   // )
//   fs.writeFileSync(
//     pathsEtc.outputDir + seed + ".txt",
//     JSON.stringify(gendOutput.stateContextPairs, null, 2)
//   )
// })
