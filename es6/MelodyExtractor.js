// Imports
// import fs
const fs = require('fs')
const path = require('path')
const { Midi } = require('@tonejs/midi')
const mu = require('maia-util')
import Analyzer from './Analyzer'
const an = new Analyzer()
import MidiExport from './MidiExport'

/**
 * Class for importing MIDI files and extracting information from them.
 */
class MelodyExtractor {
  /**
   * Constructor for the MidiImport class.
   * @param {string} _fpath - The file path of the MIDI file.
   * @param {function} _f - The function for returning the nth Farey set.
   * @param {number} _anc - The anacrusis value.
   */
  constructor(_fpath, _f = mu.farey(4), _anc = 0){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.fpath = _fpath
    this.fname = path.basename(this.fpath)
    this.ontimeIndex = 0
    this.mnnIndex = 1
    this.durationIndex = 2
    this.chanIdx = 3
    this.velIndex = 4
    this.modulo = 12
    this.winSize = 2
    this.winStep = 1
    this.velMnnWeight = 0.5
    this.points = this.get_tonal_points(this.fpath)

    // this.timeSigs = this.get_time_sigs()
    // this.anacrusis = _anc
    // this.points = this.get_points()
    // // this.points.slice(0, 3).forEach(function(p, i){
    // //   console.log("points[" + i + "]:", p)
    // // })
    // this.controlChanges = this.get_control_changes()
    // this.compObj = this.get_comp_obj(_f)
    // Possible to return something.
    // return sth;
  }

  /**
   * Finds the bass track in the MIDI file.
   * @return {Array} candidates - The array of candidates for bass tracks.
   */
  extract_melody(midiSaveDir = null){
    const self = this
    try {
      const seg = mu.segment(self.points, true, self.ontimeIndex, self.durIndex)
      // Have a look at the first five segments.
      console.log("seg.slice(0, 5):", seg.slice(0, 5))
      const prominentNotes = seg.map(function(s){
        const weightedCounts = []
        for (let i = 0; i < self.modulo; i++){
           weightedCounts[i] = { weightedCount: 0, origins: [] }
        }
        s.points.forEach(function(p){
          const mnn12 = p[self.mnnIndex] % self.modulo
          weightedCounts[mnn12]["weightedCount"] += (self.velMnnWeight*p[self.velIndex] + (1-self.velMnnWeight)*(p[self.mnnIndex]/127))
          weightedCounts[mnn12]["origins"].push(p)
        })
        const finalCounts = weightedCounts.map(function(wc){ return wc.weightedCount })

        // const winner = mu.max_argmax(finalCounts) // We only return the first note with maximun strength at present.
        // If more than one note contributes to the maximum strength, we should save all of them.
        const winner = self.return_max(finalCounts)

        // console.log("winner", winner.slice(0, 5))
        // Winner[1] will tell us which pitch contribute the winner, and we could use it to find the origin channel
        // const relevantOrigins = weightedCounts[winner[1]]["origins"]
        // TODO: add instName and channel in line 106
        // console.log("weightedCounts[winner[1]]['origins'][0]", weightedCounts[winner[1]]["origins"][0])
        const currentOriginNote = weightedCounts[winner[0][1]]["origins"][0]
        return { weightedCounts: weightedCounts, winner: winner, ontime: s.ontime, offtime: s.offtime, origins: currentOriginNote}
      })

      console.log("prominentNotes", prominentNotes.slice(0,5))

      // Reconstruct notes from the octave-free notes.
      // const transposedNotes = prominentNotes.map(function(info){
      //   return [ info.ontime, info.winner[1] + 72 ,0 , info.offtime - info.ontime, 0, 0.8 ]
      // })

      // Reconstruct notes from the original notes, which always consider the first note with the maximum strength to be the melody note.
      // let transposedNotes = []
      // prominentNotes.forEach(function(info){
      //   const currentNote = info.origins
      //   if(currentNote !== undefined){
      //     const originalNoteArr = [ currentNote[0], currentNote[1] ,0 , currentNote[2], currentNote[3], currentNote[4] ]
      //     // Avoid duplicate note.
      //     if(transposedNotes.indexOf(originalNoteArr) === -1){
      //       transposedNotes.push(originalNoteArr)
      //     }
      //   }
      // })

      const transposedNotes = self.reconstruct_melody_witn_window(prominentNotes)
      // console.log("transposedNotes", transposedNotes.slice(0,5))

      // Export MIDI file.
      if (midiSaveDir){
        const _fpath = path.join(midiSaveDir, self.fname)
        new MidiExport(
          transposedNotes, [], _fpath, {
            "scaleFactor": 0.5,
            "timeSigTopNo": 4,
            "timeSigBottomNo": 4,
            "noteIndices": {
              "ontimeIndex": 0,
              "mnnIndex": 1,
              "durationIndex": 3,
              "channelIndex": 4,
              "velocityIndex": 5
            },
            "ccIndices": {
              "ontimeIndex": 0,
              "numberIndex": 1,
              "channelIndex": 2,
              "valueIndex": 3
            }
          }
        )
      }
      return transposedNotes
    }
    catch (e) {
      console.log(e)
    }
  }



  get_tonal_points(midiPath){
    const midiData = fs.readFileSync(
      midiPath
    )
    const midi = new Midi(midiData)

    // Grab time signature information.
    const timeSigs = [midi.header.timeSignatures.map(function(ts){
      return {
        "barNo": ts.measures + 1,
        "topNo": ts.timeSignature[0],
        "bottomNo": ts.timeSignature[1],
        "ontime": ts.ticks/midi.header.ppq
      }
    })[0]]

    // Here we will get the track/instrument information.
    // console.log("Track information:", midi.tracks)

    let allTracks = []
    // In future if you want to separate out percussion tracks, something like
    // track.instrument.family === "drums"
    // and defining a second or third array above to hold separated tracks
    // might be a good idea.
    let tmp_track_cnt = 0
    let max_tick = 0
    let tmp_instrument = []
    let tonalPoints = []
    midi.tracks.forEach(function(track, idx){
      let allPoints = []
      if(track.notes.length > 0){
        tmp_track_cnt ++

        const instrInfo = track.instrument.family + " -> " + track.instrument.name
        // console.log("instrInfo:", instrInfo)
        // // Get instrument number
        // console.log("track.instrument.number:", track.instrument.number)
        tmp_instrument.push({"number": track.instrument.number, "family": track.instrument.family, "name": track.instrument.name})

        track.notes.forEach(function(n){
          // Update max_tick:
          if(n.ticks + n.durationTicks > max_tick){
            max_tick = n.ticks + n.durationTicks
          }
          // pt = [beat, midi note number, duration, channel, velocity]
          if(n.midi <= 127 && n.midi >=0){
            let pt = [
              Math.round(100000*(n.ticks/midi.header.ppq))/100000,
              n.midi,
              Math.round(100000*(n.durationTicks/midi.header.ppq))/100000,
              track.channel,
              Math.round(1000*n.velocity)/1000
            ]
            allPoints.push(pt)
            if (track.instrument.family !== "drums"){
              // Tom uses maia-util uniqueness code below.
              tonalPoints.push(pt)
              // Chenyu's code
              // if(tonalPoints.indexOf(pt) === -1){
              //   tonalPoints.push(pt)
              // }
            }
          }

        })
        if(allPoints.length > 0){
          allTracks.push({"pt": allPoints, "instrument": track.instrument, "name": track.name, "channel":track.channel, "tempo": midi.header.tempos})
        }
      }
      // console.log("midi.header", midi.header)
    })
    // Tom's code for sorting points.
    tonalPoints = mu.unique_rows(tonalPoints, true)[0]
    // Chenyu's code
    // tonalPoints = tonalPoints.sort(function(a, b){
    //   return a[0]-b[0]
    // })
    return tonalPoints
  }



  find_note_idx_in_window(prominentNotes, startOntime, endOntime){
    let startIdx = 0
    let endIdx = 0
    for(let i = 1; i <= prominentNotes.length-1; i ++){
      const currentProminentNote = prominentNotes[i]
      if(currentProminentNote.offtime > startOntime && prominentNotes[i-1].offtime <= startOntime && prominentNotes[i-1].ontime < endOntime){
        startIdx = i - 1
      }
      if(currentProminentNote.ontime >= endOntime && prominentNotes[i-1].ontime < endOntime && prominentNotes[i-1].ontime > startOntime){
        endIdx = i - 1
      }

    }
    return [startIdx, endIdx]
  }

  find_note_idx_in_window_specific_channel(channel, tmpWinStart, tmpWinEnd){
    console.log("******channel", channel)
    let flag = 0
    for(let i = 0; i <= this.points.length-1; i ++){
      if(
        this.points[i][3] === channel &&
        this.points[i][0] >= tmpWinStart &&
        this.points[i][0] < tmpWinEnd
      ){
        flag = 1
        console.log("orgPoints", this.points[i])
      }
    }
    return flag
  }

  reconstruct_melody_witn_window(prominentNotes){
    const self = this
    let melodyChannel = []
    const winSize = this.winSize
    const winStep = this.winStep
    const timeSig = 4 // TODO: we will need to know the real time segment.

    let winStart = 0
    let winEnd = winStart + winSize*timeSig
    const winEndOntime = prominentNotes[prominentNotes.length-1].ontime

    console.log("prominentNotes.length", prominentNotes.length)
    // Notes in weightedCounts [ ontime, pitch, duration, channel, velocity]
    while(winStart < winEndOntime){

      const winIdx = this.find_note_idx_in_window(prominentNotes, winStart, winEnd)
      // console.log("***winStart", winStart)
      // console.log("***winEnd", winEnd)
      if(winIdx[1] !== 0){
        const findMelodyOut = this.find_melody_channel(prominentNotes, winIdx[0], winIdx[1])
        const currentMelodyChannel = findMelodyOut[0]
        const currentMaxStrength = findMelodyOut[1]
        // console.log("currentMelodyChannel", currentMelodyChannel)
        // Update the array that stores the position and channel for melody.
        // Need to check if current measure is empty, if so, start from winStart + 1 bar.
        currentMelodyChannel.forEach(function(item){
          for(let tmpWinStart = winStart; tmpWinStart + 1*timeSig <= winEnd; tmpWinStart = tmpWinStart+1*timeSig){
            let tmpWinEnd = tmpWinStart + 1*timeSig
            console.log("&&&&&&&tmpWinStart", tmpWinStart)
            console.log("&&&&&&&tmpWinEnd", tmpWinEnd)
            let flag = self.find_note_idx_in_window_specific_channel(parseInt(item), tmpWinStart, tmpWinEnd)
            if(flag !== 0){
              melodyChannel.push([parseInt(item),[tmpWinStart, tmpWinEnd], currentMaxStrength])
            }
          }

        })
      }

      winStart = winStart + winStep*timeSig
      winEnd = winStart + winSize*timeSig

      // console.log("nextStartIdx", nextStartIdx)
    }
    console.log("melodyChannel", melodyChannel)
    // Reconstruct melody from the full point set.
    const melodyNotes = this.get_melody_points(melodyChannel)
    return melodyNotes
  }

  get_melody_points(melodyChannel){
    // Using the greedy algorithm to calculate which track should each measure belong to.
    let melodyPoints = []
    let processedMelodyChannel = []
    let startOntime = 0
    let endOntime = melodyChannel[melodyChannel.length - 1][1][1]
    while(startOntime < endOntime){
      let channelCount = {}
      for(let i = 0; i < melodyChannel.length; i ++){
        if(endOntime < startOntime){
          break
        }
        if(melodyChannel[i][1][0] > startOntime){
          break
        }
        if(melodyChannel[i][1][0] <= startOntime && melodyChannel[i][1][1] > startOntime){
          let currentChannel = melodyChannel[i][0].toString()
          if(!(currentChannel in channelCount)){
            channelCount[currentChannel] = 0
          }
          // channelCount[currentChannel] = channelCount[currentChannel] + 1
          channelCount[currentChannel] += melodyChannel[i][2]
        }
      }
      // Update processedMelodyChannel
      let maxCount = 0
      let channelList = Object.keys(channelCount)
      let winChannel = channelList[0]
      for(let i = 0; i < channelList.length; i ++){
        if(channelCount[channelList[i]] > maxCount){
          maxCount = channelCount[channelList[i]]
          winChannel = channelList[i]
        }
      }
      processedMelodyChannel.push([parseInt(winChannel), startOntime])
      startOntime = startOntime + 1
    }
    console.log("processedMelodyChannel", processedMelodyChannel)
    // Get melody points
    let currentOntimeIdx = 0
    this.points.forEach(function(point){
      // const originalNoteArr = [ currentNote[0], currentNote[1] ,0 , currentNote[2], currentNote[3], currentNote[4] ]
      if((point[0] >= processedMelodyChannel[currentOntimeIdx][1] + 1) && (currentOntimeIdx < processedMelodyChannel.length - 1)){
        currentOntimeIdx = currentOntimeIdx + 1
      }
      if(point[3] === processedMelodyChannel[currentOntimeIdx][0]){
        melodyPoints.push([point[0], point[1] ,0 , point[2], point[3], point[4]])
      }
    })
    return melodyPoints
  }

  find_melody_channel(prominentNotes, startIdx, endIdx){
    const self = this
    let strengthSum = {}
    let orgPointsList = {}
    for(let i = startIdx; i <= endIdx; i ++){
      let currentWinner = prominentNotes[i]['winner']
      // console.log("======currentWinner", currentWinner)
      currentWinner.forEach(function(winner){
        // console.log("winner", winner)
        // console.log("prominentNotes[i]['weightedCounts'][currentWinner[1]]", prominentNotes[i]['weightedCounts'])
        let orgPoints = prominentNotes[i]['weightedCounts'][winner[1]]['origins'][0]
        if(orgPoints !== undefined){
          orgPoints = [orgPoints]
          // console.log("orgPoints", orgPoints)
          orgPoints.forEach(function(point){
            const currentChannel = point[self.chanIdx].toString()
            if(!(currentChannel in orgPointsList)){
              orgPointsList[currentChannel] = []
              // console.log("orgPointsList", orgPointsList)
            }
            else if(orgPointsList[currentChannel].indexOf(point) === -1){
              // console.log("point", point)
              orgPointsList[currentChannel].push(point)
              if(!(currentChannel in strengthSum)){
                strengthSum[currentChannel] = 0
              }
              // strengthSum[currentChannel] += point[self.velIndex]
              strengthSum[currentChannel] += prominentNotes[i]['weightedCounts'][winner[1]]['weightedCount']
            }

          })
        }

      })
    }
    // console.log("orgPointsList", orgPointsList)
    // Calculate entropy for each channel.
    let entropyChannel = []
    let channelSet = Object.keys(strengthSum)
    for(let i = 0; i < channelSet.length; i ++){
      entropyChannel[channelSet[i]] = 0
      if(orgPointsList[channelSet[i]].length > 1){
        const comp = an.note_point_set2comp_obj(orgPointsList[channelSet[i]],
          [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}],
          false,
          null,
          0, 1, 2, 3, 4)
        const relNotes = comp.notes
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
        entropyChannel[channelSet[i]] = mu.entropy(pdist)
        // console.log("channelSet[i]", channelSet[i])
        // console.log("entropyChannel[channelSet[i]]", entropyChannel[channelSet[i]])
      }

    }

    // Normalise noteStrength and entropyList.
    // For note strength
    let maxStrength = 0
    for(let i = 0; i < channelSet.length; i ++){
      if(strengthSum[channelSet[i]] > maxStrength){
        maxStrength = strengthSum[channelSet[i]]
      }
    }
    for(let i = 0; i < channelSet.length; i ++){
      strengthSum[channelSet[i]] = strengthSum[channelSet[i]]/maxStrength
    }
    // For entropy
    let maxEntropy = 0
    for(let i = 0; i < channelSet.length; i ++){
      if(entropyChannel[channelSet[i]] > maxEntropy){
        maxEntropy = entropyChannel[channelSet[i]]
      }
    }
    for(let i = 0; i < channelSet.length; i ++){
      entropyChannel[channelSet[i]] = entropyChannel[channelSet[i]]/maxEntropy
    }

    // Calculate strength+entropy
    let maxStrengthEntropy = 0
    // console.log("strengthSum", strengthSum)
    // Let's return all melody channels with the maximum strength.
    let melodyChannel = []
    for(let i = 0; i < channelSet.length; i ++){
      if(strengthSum[channelSet[i]] > maxStrengthEntropy){
        maxStrengthEntropy = strengthSum[channelSet[i]] + entropyChannel[channelSet[i]]
      }
    }
    for(let i = 0; i < channelSet.length; i ++){
      if(strengthSum[channelSet[i]] + entropyChannel[channelSet[i]] === maxStrengthEntropy){
        melodyChannel.push(channelSet[i])
      }
    }
    // console.log("melodyChannel", melodyChannel)
    return [melodyChannel, maxStrengthEntropy]
  }

  return_max(finalCounts){
    let outArr = []
    let maxStrength = mu.max_argmax(finalCounts)[0]
    finalCounts.forEach(function(strength, idx){
      if(strength === maxStrength){
        outArr.push([strength, idx])
      }
    })
    return outArr
  }

}
export default MelodyExtractor
































// ...
