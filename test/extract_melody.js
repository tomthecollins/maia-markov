// Copyright Tom Collins and Chenyu Gao, 20.9.2024
// Pre-processing MIDI files, extracting the melody.

// Requires
const argv = require('minimist')(process.argv.slice(2))
const fs = require("fs")
const path = require("path")
const plotlib = require("nodeplotlib")
const mm = require("../dist/index")
const mu = require("maia-util")
const an = new mm.Analyzer()


// const ps = [[1, 64, 3], [1, 65, 1], [2, 67, 1.5], [4, 67, 1], [1, 64, 1]]
// const w = 2
// console.log(mu.count_rows(ps, w))

// const ps2 = [[1, 64], [1, 65], [2, 67], [4, 67], [1, 64]]
// console.log(mu.count_rows(ps2))
// return

// Individual user paths
const mainPaths = {
  "tom": {
    "inDir": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "melody_extraction", "in", "combined"
    ),
    "outDir": path.join(
      "/Users", "tomthecollins", "Shizz", "York", "Students", "Chenyu\ Gao",
      "melody_extraction", "out"
    ),
    "outFileName": "blah"
  },
  "chenyu": {
    "inDir": path.join(
      "/Users", "gaochenyu", "Chenyu\ Gao", "MusicAI\ Research", "automatic_arranging", 
      "melody\ extraction", "samples_melody_extraction"
    ),
    "outDir": path.join(
      "/Users", "gaochenyu", "Chenyu\ Gao", "MusicAI\ Research", "automatic_arranging", 
      "melody\ extraction", "maia-markov_out"
    ),
    "outFileName": "blah"
  }
}

// Parameters
const param = {
  "ontimeIndex": 0,
  "mnnIndex": 1,
  "durIndex": 2
}

// Declare/initialize the variables that will contain the results of the analysis.
const myArr = []
const myObj = {}

// Import and analyse the MIDI files.
const mainPath = mainPaths[argv.u]
console.log("Here we go!")
let files = fs.readdirSync(mainPath["inDir"])
files = files.filter(function(file){
  return path.extname(file) === ".mid"
})
console.log("files.length:", files.length)

// Iterate
files
// .slice(0, 1)
.forEach(function(file, ithFile){
  console.log("ithFile:", ithFile)
  const fid = file.split(".mid")[0]
  console.log("fid:", fid)
  try {
    // Array to record proportion of segments for which all notes are inside.
    let insideArr = []
    const mi = new mm.MidiImport(
      path.join(mainPath["inDir"], file),
      [0, 1/6, 1/4, 1/3, 1/2, 3/2, 3/4, 5/6, 1]
    )
    const seg = mu.segment(mi.points, true, param.ontimeIndex, param.durIndex)
    // Have a look at the first five segments.
    console.log("seg.slice(0, 5):", seg.slice(0, 5))

    // Get the indices where tracks live with certain instrument families and names.
    let candidates = []
    mi.data.tracks.forEach(function(trk, idx){
      candidates.push({
        "index": idx, "channel": trk.channel,
        "family": trk.instrument.family, "name": trk.instrument.name
      })
    })
    console.log("mi.data.header.ppq:", mi.data.header.ppq)
    // Remove any empty tracks.
    candidates = candidates.filter(function(c){
      return mi.data.tracks[c["index"]].notes.length > 0
    })
    // Remove drums and sound effects!
    candidates = candidates.filter(function(c){
      return c.family !== "drums" && c.family !== "sound effect"
    })
    // console.log("candidates:", candidates)

    // Calculate some distributions.
    // console.log(
    //   'mi.data.tracks[candiates[0]["index"]]].notes.slice(0, 10):',
    //   mi.data.tracks[candidates[0]["index"]].notes.slice(0, 10)
    // )
    // console.log("mi.points.slice(20, 40):", mi.points.slice(20, 40))
    // console.log("mi.compObj.notes.slice(20, 40):", mi.compObj.notes.slice(20, 40))

    // Iterate over the candidates and calculate some distributions.
    candidates.forEach(function(c, idx){
      // Obtain relevant notes/points.
      const relNotes = mi.compObj.notes.filter(function(n){
        return n.staffNo === c.index
      })
      // if (idx === 0){
      //   console.log("Here are the first few notes on " + c.family + ", " + c.name)
      //   console.log("relNotes.slice(0, 10):", relNotes.slice(0, 10))
      // }
      // Get the beatOn and MNN properties in a numeric array.
      const arr = relNotes.map(function(n){ return [n.beatOn, n.MNN] })
      const hist = mu.count_rows(arr, undefined, true)
      const sumArr = mu.array_sum(hist[1])
      // Convert count to probability distribution.
      const pdist = hist[1].map(function(freq){
        return freq/sumArr
      })
      const h = mu.entropy(pdist)
      // if (idx === 0){
      //   console.log("hist:", hist)
      //   console.log("sumArr:", sumArr)
      //   console.log("pdist:", pdist)
      //   console.log("entropy:", h)
      // }

      c.entropy = h

    })
    console.log("candidates:", candidates)



    // Extract feature.
    // seg.forEach(function(s){
    //   const ans = every_inside(s, param.ontimeIndex, param.durIndex)
    //   insideArr.push(ans)
    // })
    // console.log("insideArr:", insideArr)
    // // Count number of trues.
    // const trues = insideArr.reduce(function(a, b){
    //   if (b){
    //     return a + 1
    //   }
    //   else {
    //     return a
    //   }
    // }, 0)
    // console.log("trues:", trues)
    // console.log("insideArr.length:", insideArr.length)
  }
  catch (e) {
    console.log(e)
  }
})


// Helper function
function everything_inside(
  givenSegment, ontimeIndex, durIndex
){
  // I've coded this function with forEach() to demonstrate its use, but it
  // would be better coded with every(), which is a JS array method to test
  // whether every element of an array passes a test, and will stop early as
  // soon as one element does not pass. I've put this more efficient approach
  // below.

  // console.log("givenSegment.points:", givenSegment.points)
  // console.log(givenSegment.ontime, givenSegment.offtime)
  let ans = true
  // givenSegment has properties ontime, offtime, and points.
  givenSegment.points.forEach(function(pt){
    // If conditional concerning pt[ontimeIndex] and ontime,
    // and  pt[ontimeIndex] + pt[durIndex] and offtime.
    if (
      pt[ontimeIndex] < givenSegment.ontime ||
      pt[ontimeIndex] + pt[durIndex] > givenSegment.offtime
    ){
      // If the conditional evaluates to true, return false from the overall function.
      ans = false
    }
  })
  // If we get here with ans unaltered, then each note is "inside the segment",
  // and true will be returned.
  return ans
}


function every_inside(
  givenSegment, ontimeIndex, durIndex
){
  // console.log("givenSegment.points:", givenSegment.points)
  // console.log(givenSegment.ontime, givenSegment.offtime)
  // givenSegment has properties ontime, offtime, and points.
  return givenSegment.points.every(function(pt){
    // If conditional concerning pt[ontimeIndex] and ontime,
    // and  pt[ontimeIndex] + pt[durIndex] and offtime.
    return pt[ontimeIndex] >= givenSegment.ontime &&
    pt[ontimeIndex] + pt[durIndex] <= givenSegment.offtime
  })
}
