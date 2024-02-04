// Requires
const argv = require('minimist')(process.argv.slice(2))
const path = require("path")
const mu = require("maia-util")
const mm = require('../dist/index')
const an = new mm.Analyzer()

const mainPaths = {
  "tom": {
    "inStm": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "markov_infilling", "pop_909_train.json"
    )
  },
  "chenyu": {
    "inStm": "/Users/gaochenyu/Codes/markov_out/pop909_train.json"
  }
}

// Grab user name from command line to set path to stm.
const mainPath = mainPaths[argv.u]

const dataEx = require(mainPath["inStm"])

console.log("dataEx[4]['continuations']:", dataEx[4]["continuations"])
const ans = count_continuations(dataEx[4]["continuations"], "beat_rel_sq_MNN_state")
console.log("ans:", ans)

// console.log("dataEx", dataEx.length)
const dataExStr = dataEx.map(function(st){
  // Get count of continuations.
  const contnCount = count_continuations(st.continuations, "beat_rel_sq_MNN_state")
  const contnAndDist = contnCount[0].map(function(contn, idx){
    return {
      "beat_rel_sq_MNN_state": an.state2string(contn),
      "dist": 1/contnCount[1][idx]
    }
  })

  return {
    "beat_rel_sq_MNN_state": an.state2string(st.beat_rel_sq_MNN_state),
    "continuations": contnAndDist
  }
})
// const dataExStr = dataEx.map(function(st){
//   return {
//     "beat_rel_sq_MNN_state": an.state2string(st.beat_rel_sq_MNN_state),
//     "continuations":st.continuations.map(function(con){
//       return {
//         "beat_rel_sq_MNN_state": an.state2string(con.beat_rel_sq_MNN_state),
//         "context": con.context
//       }
//     })
//   }
// })
console.log("dataExStr[4]['continuations']:", dataExStr[4]["continuations"])

let g = new mm.Graph(dataExStr, "beat_rel_sq_MNN_state", "continuations", "dist")
// let g = new mm.Graph()
// dataExStr.map(function(d){
//   d.continuations.map(function(nb){
//     g.add_edge(d.beat_rel_sq_MNN_state, nb.beat_rel_sq_MNN_state, 1)
//   })
// })
const path2 = g.print_scenic_path("2.5|-5,-1,2", "1.5|-8,-1,11", 0.5)


// const path2 = g.print_scenic_path("1.75|-12,-7,0,4", "1.5|-12,0,2", 0.1)
console.log("path2:", path2)




function count_continuations(contn, stateType){
  const states = contn.map(function(c){ return c[stateType] })
  return mu.count_rows(states, undefined, true)
}
