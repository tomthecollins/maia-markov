// Copyright Tom Collins, 20.8.2020

// Individual user paths.
const mainPaths = {
  "tom": {
    "midi": "/Users/tomthecollins/Shizz/York/Students/PhD/Alex\ \(Zongyu\)\ Yin/listening\ study/Model\ Generated/MusicTransformer/",
    "midiDirs": [ "Classical\ Piano", "String\ Quartet" ],
    "outputDir": __dirname + "/out/transformer_midi/",

  },
  "alex": {
    // ...
  }
}

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")

// Parameters
const excerptLength = 30
const threshDurSec = 2
const sf = 1

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


// Helper function.
function duration_of_long_notes(aPointSet, aDurSecThresh){
  const segs = mu.segment(aPointSet, false, 0, 2)
  let dur = 0
  segs.forEach(function(seg){
    const segDur = seg.offtime - seg.ontime
    if (segDur > threshDurSec){
      dur += segDur
    }
  })
  if (segs[segs.length - 1].offtime < excerptLength){
    dur += excerptLength - segs[segs.length - 1].offtime
  }
  return dur
}


// Import and analyse the MIDI files.
let midiDirs = fs.readdirSync(mainPath["midi"])
midiDirs = midiDirs.filter(function(midiDir){
  return mainPath["midiDirs"].indexOf(midiDir) >= 0
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir);
  let pointSets = []
  let pFiles = fs.readdirSync(mainPath["midi"] + midiDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "mid"
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
      let points = []
      midi.tracks.forEach(function(track){
        // if (track.channel == targetChannel){
          track.notes.forEach(function(n){
            points.push([
              n.time,
              // n.ticks/midi.header.ppq,
              n.midi,
              n.duration,
              // n.durationTicks/midi.header.ppq,
              track.channel,
              Math.round(1000*n.velocity)/1000
            ])
          })
        // }
      })
      // Cut anything beyond 30 sec.
      points = points.filter(function(p){
        return p[0] + p[2] < excerptLength
      })
      points = mu.sort_rows(points)[0]
      pointSets.push({
        "id": pFile.split(".")[0],
        "points": points,
        "durLongNotes": duration_of_long_notes(points, threshDurSec)
      });
    }
    catch (e) {
      console.log(e)
    }
  })

  // Can be adapted to copying detection at some point.
  // if (midiDir == "String\ Quartet"){
  //   windowOverlapSizes.forEach(function(wo){
  //     let segs = []
  //     // pointSets.slice(0, 5).forEach(function(c){
  //     pointSets.forEach(function(c){
  //       const points = c.points
  //       // const points = mu.comp_obj2note_point_set(c)
  //       let ontimeInSrc = 0
  //       let win = wo.winSize
  //       let overlap = wo.overlap
  //       let lastOntime = points[points.length - 1][0]
  //
  //       while (ontimeInSrc < lastOntime){
  //         let obj = {
  //           "ontimeInSrc": ontimeInSrc,
  //           "points": mu.points_belonging_to_interval(points, ontimeInSrc, ontimeInSrc + win),
  //           "pieceId": c.id
  //         }
  //         segs.push(obj)
  //         ontimeInSrc += overlap
  //       }
  //     })
  //     console.log("segs.length:", segs.length)
  //
  //
  //     let ontimeInGen = 0
  //     let genSegmentOntimes = []
  //     let win = wo.winSize
  //     let overlap = wo.overlap
  //     let lastOntime = tiPoints[tiPoints.length - 1][0]
  //     let maxSimilarities = []
  //     while (ontimeInGen < lastOntime){
  //       console.log("ontimeInGen:", ontimeInGen)
  //       console.log("lastOntime:", lastOntime)
  //       genSegmentOntimes.push(ontimeInGen)
  //       let obj = {
  //         "ontimeInGen": ontimeInGen,
  //         "maxSimilarity": null,
  //         "maxPieceId": null,
  //         "maxPoints": null
  //       }
  //       let tiPointsSegment = mu.points_belonging_to_interval(tiPoints, ontimeInGen, ontimeInGen + win)
  //       // console.log("tiPointsSegment:", tiPointsSegment)
  //
  //       // Calculate the similarities.
  //       let src = segs.map(function(seg){ return seg.pieceId })
  //       let cardScores = segs.map(function(seg){
  //         let cs = 0
  //         if (seg.points.length > 0 && tiPointsSegment.length > 0){
  //           const a = mu.unique_rows(
  //             seg.points.map(function(p){
  //               return [Math.round(24*p[0]), p[2]]
  //             })
  //           )[0]
  //           const b = mu.unique_rows(
  //             tiPointsSegment.map(function(p){
  //               return [Math.round(24*p[0]), p[2]]
  //             })
  //           )[0]
  //           cs = mu.cardinality_score(a, b)
  //         }
  //         return cs[0]
  //       })
  //       const ma = mu.max_argmax(cardScores)
  //       obj.maxSimilarity = ma[0]
  //       obj.maxPieceId = src[ma[1]]
  //       obj.maxPoints = segs[ma[1]]
  //       maxSimilarities.push(obj)
  //
  //       ontimeInGen += overlap
  //     }
  //     console.log("maxSimilarities:", maxSimilarities)
  //
  //     // Plot it.
  //     let data = [{
  //       "x": genSegmentOntimes,
  //       "y": maxSimilarities.map(function(ms){ return ms.maxSimilarity }),
  //       "type": "line"
  //     }]
  //     const layout = { "yaxis": { "range" : [0, 1] } }
  //     // console.log("data[0]:", data[0])
  //     plotlib.stack(data, layout)
  //
  //   })
  //
  //   plotlib.plot()
  // }

  // Sort point sets by metric(s).
  pointSets = pointSets.sort(function(a, b){
    return a.durLongNotes - b.durLongNotes
  })
  console.log("pointSets:", pointSets)

  // Export to MIDI.
  pointSets.forEach(function(ps){
    let midiOut = new Midi()
    let track = midiOut.addTrack()
    ps.points.forEach(function(p){
      track.addNote({
        midi: p[1],
        time: sf*p[0],
        duration: sf*p[2],
        velocity: p[4]
      })
    })
    fs.writeFileSync(
      mainPath["outputDir"] + midiDir + "/" + ps.id + ".midi",
      new Buffer(midiOut.toArray())
    )
  })


})
