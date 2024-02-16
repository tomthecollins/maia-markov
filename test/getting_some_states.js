// Requires
const argv = require('minimist')(process.argv.slice(2))
const path = require("path")
const sr = require('seed-random')
const mu = require("maia-util")
const mm = require('../dist/index')
const an = new mm.Analyzer()

const mainPaths = {
  "tom": {
    "inInitial": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "markov_infilling", "pop_909_train_initial.json"
    ),
    "inStm": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "markov_infilling", "pop_909_train.json"
    )
  },
  "chenyu": {
    "inInitial": "/Users/gaochenyu/Codes/markov_out/pop909_train_initial.json",
    "inStm": "/Users/gaochenyu/Codes/markov_out/pop909_train.json"
  }
}


// Parameters
// Some of these are specific to the Markov modelling, which has now been
// commented out of this script.
const numberOfStatesToGenerate = 10
const param = {
  "seed": "Friday",
  "stateType": "beat_rel_sq_MNN_state",
  "onAndOff": false,
  "squashRangeMidi": 12,
  "nosConsecutives": 4,
  // "downbeat": {
  //   "histType": "drumsTrueVelocityTrue",
  //   "drumsOnly": true,
  //   "rounding": true,
  //   "granularity": 4,
  //   "beatsInMeasure": 4,
  //   "velocityIndex": 4,
  //   "ontimeIndex": 0
  // }
}
sr(param.seed, {global: true})

// Grab user name from command line to set path to stm.
const mainPath = mainPaths[argv.u]

const initial = require(mainPath["inInitial"])
const stm = require(mainPath["inStm"])

// console.log("stm[4]['continuations']:", stm[4]["continuations"])
// const ans = count_continuations(stm[4]["continuations"], "beat_rel_sq_MNN_state")
// console.log("ans:", ans)


// This code is a modification of es6 -> Generator.js -> get_suggestion(). It is
// modified because we don't need it to turn state-context pairs into points
// each time. I'm just using it to get some state-context pairs so Chenyu can
// see an example of input to path2sc_pairs().
const stateType = param.stateType
const nosConsecutives = param.nosConsecutives

const lkStateContext = mu.choose_one(initial)
let stateCtxPairs = [lkStateContext]//, points
let lkState = lkStateContext[stateType]
let counter = 0
while (counter < numberOfStatesToGenerate){
  const relIdx = mu.array_object_index_of_array(stm, lkState, stateType)
  if (relIdx == -1){
    console.log("Early stop: state was not found in the stm.")
    break
  }
  // Use it to grab continuations and pick one at random.
  const conts = stm[relIdx].continuations
  const currCont = mu.choose_one(conts)
  stateCtxPairs.push(currCont)
  lkState = currCont[stateType]
  counter++
}

console.log("stateCtxPairs:", stateCtxPairs)
