// Requires
const argv = require('minimist')(process.argv.slice(2))
const path = require("path")
const mu = require("maia-util")
const mm = require('../dist/index')
const an = new mm.Analyzer()
const fs = require("fs")
const { Midi } = require('@tonejs/midi')

const mainPaths = {
  "tom": {
    "inStm": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "markov_infilling", "pop_909_train.json"
    )
  },
  "chenyu": {
    "inStm": "/Users/gaochenyu/Codes/markov_out/pop909_train.json",
    "midi": path.join(
      "/Users/gaochenyu/Dataset/POP909_with_structure_labels/29thSep2023_theme_var_extracted_for_training"),
    "midiDirs": ["train"],
    "themeSample": ["003_A_0.mid"]
  }
}

// Grab user name from command line to set path to stm.
const mainPath = mainPaths[argv.u]

const dataEx = require(mainPath["inStm"])

console.log("dataEx[4]['continuations']:", dataEx[4]["continuations"])
const ans = count_continuations(dataEx[4]["continuations"], "beat_rel_sq_MNN_state")
console.log("ans:", ans)

// Deduplicate a particular property of the continuations array, convert the
// numeric arrays to strings, use the counting performed during deduplication
// to provide distances between states, and return ready for loading onto a
// graph.
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
// console.log("g", g.vertexMap['3|-5,-1,2'].nbs)
const path2 = g.print_scenic_path("2.5|-5,-1,2", "1.5|-8,-1,11", 0.5)
// const path2 = g.print_scenic_path("2.5|-5,-1,2", "2.5|-5,-1,2", 0.5)


// const path2 = g.print_scenic_path("1.75|-12,-7,0,4", "1.5|-12,0,2", 0.1)
console.log("path2:", path2)



// Obtain states from a theme.
const midiData = fs.readFileSync(
  path.join(mainPath["midi"], mainPath["midiDirs"][0], mainPath["themeSample"][0])
)
const midi = new Midi(midiData)
console.log("midi.header", midi.header)
const timeSigs = [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}]
if (timeSigs[0].topNo !== 4){
  console.log("timeSigs:", timeSigs)
}
let allPoints = []
midi.tracks.forEach(function(track, idx){
  const trgTestStr = track.instrument.family + " -> " + track.instrument.name
  console.log("trgTestStr:", trgTestStr)
  // console.log("track.instrument.family:", track.instrument.family)
  // console.log("track.instrument.name:", track.instrument.name)
  track.notes.forEach(function(n){
    let pt = [
      n.ticks/midi.header.ppq,
      n.midi,
      n.durationTicks/midi.header.ppq,
      track.channel,
      Math.round(1000*n.velocity)/1000
    ]
    allPoints.push(pt)
  })
})

// Key detection
const fsm = mu.fifth_steps_mode(allPoints, mu.krumhansl_and_kessler_key_profiles)
// console.log("fsm:", fsm)
allPoints.forEach(function(p){
  p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
})
let comp = an.note_point_set2comp_obj(
  allPoints, timeSigs, false, [0, 1/4, 1/3, 1/2, 2/3, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
)
let current_state = an.comp_obj2beat_rel_sq_mnn_states(comp)
// ??? Decimal beat does not exist in 'pop909_train.json'.
console.log("Beginning_state", current_state[0])
console.log("End_state", current_state[current_state.length-1]) 

const path3 = g.print_scenic_path("1|0", "3.5|-3", 0.5)
console.log("path3", path3)
console.log("dataEx.length", dataEx.length)



function count_continuations(contn, stateType){
  const states = contn.map(function(c){ return c[stateType] })
  return mu.count_rows(states, undefined, true)
}
