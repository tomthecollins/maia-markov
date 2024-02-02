const mm = require('../dist/index');
const an = new mm.Analyzer()

const dataEx = require("/Users/gaochenyu/Codes/markov_out/pop909_train.json")
// console.log("dataEx", dataEx.length)
const dataExStr = dataEx.map(function(st){
  return {"beat_rel_sq_MNN_state": an.state2string(st.beat_rel_sq_MNN_state), 
  "continuations":st.continuations.map(function(con){
    return {"beat_rel_sq_MNN_state": an.state2string(con.beat_rel_sq_MNN_state), "context": con.context}
  })}
})
// console.log("dataExStr", dataExStr[0])

// let g = new mm.Graph(dataExStr, "beat_rel_sq_MNN_state", "continuations", "dist")
let g = new mm.Graph()
dataExStr.map(function(d){
  d.continuations.map(function(nb){
    g.add_edge(d.beat_rel_sq_MNN_state, nb.beat_rel_sq_MNN_state, 1)
  })
})
const path2 = g.print_scenic_path("1.75|-12,-7,0,4", "1.5|-12,0,2", 0.1)
console.log("path2:", path2)