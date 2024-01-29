var mu = require("maia-util")
var uu = require("uuid/v4")

// var gr = require("./graph/Graph")

// Tom Collins 1/23/2018.
// I need to check these are as up-to-date a pair of functions as we have.
function comp_obj2beat_mnn_states(
  compObj, onAndOff = true, idxOn = 0, idxMNN = 1, idxDur = 3
){
  // Tom Collins 11/1/2015.
  // This function converts a compObj variable to an array consisting of
  // json variables. Each json variable contains state and context information
  // for a segment of the input compObj variable. This can then be analysed
  // (by another function) for possible continuations between states in one or
  // more pieces.

  var out_array = [];
  // console.log('compObj:');
  // console.log(compObj);
  if (compObj.timeSignatures.length > 1){
    console.log("More than one time signature in this piece.");
    console.log("Might not be the best idea to analyse with this function.");
    console.log("Stopping analysis for this piece.");
    return out_array;
  }
  else {
    var D = mu.comp_obj2note_point_set(compObj);
    var segE = mu.segment(D, onAndOff, idxOn, idxDur);

    // Iterate over segE, converting the ontime of each segment to a beat
    // number and extracting the MIDI note numbers.
    for (i = 0; i < segE.length; i++){
      var bar_beat = mu.bar_and_beat_number_of_ontime(
        segE[i].ontime, compObj.timeSignatures
      );
      // This is beat of the bar in crotchet beats rounded to 5 decimal places.
      var beat_round = Math.round(bar_beat[1]*100000)/100000;
      var MNN = new Array(segE[i].points.length)
      for (j = 0; j < segE[i].points.length; j++){
        MNN[j] = segE[i].points[j][idxMNN];
      }
      // Sort the MNN_rel entries and retain only the unique members.
      var unqAndIdx = mu.unique_rows(MNN.map(function(m){ return [m] }))
      var unqMNN = unqAndIdx[0].map(function(arr){ return arr[0] })
      // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
      var mapSwitch = new Array(MNN.length)
      unqAndIdx[1].map(function(arr, idx){
        arr.map(function(el){
          mapSwitch[el] = idx
        })
      })
      // var unqMNN = mu.get_unique(
      //   MNN_rel.sort(function(a, b) { return a - b; })
      // );

      // Tuplets in scores can cause rounding errors when states are created, so
      // check for very small time differences between consecutive states, and
      // ignore a state if it is followed really soon after by another.
      // *********************************************************************
      // 20200218. Also now getting rid of rest states here. They add noise. *
      // *********************************************************************
      if (segE[i].offtime - segE[i].ontime >= .00002 && unqMNN.length > 0){
        out_array.push({
          "beat_MNN_state": [beat_round, unqMNN],
          "context": {
            "piece_id": compObj.id,
            "orig_points": segE[i].points,
            "map_into_state": mapSwitch
          }
        });
      }
      // else{
      //   console.log('A state was thrown out because of being a rest or ' +
      //   ' followed really soon after by another.');
      //   console.log('segE[i]:');
      //   console.log(segE[i]);
      //   console.log('segE[i + 1]:');
      //   console.log(segE[i + 1]);
      // }
    }
    return out_array;
  }
}

function comp_obj2beat_rel_mnn_states(
  compObj, onAndOff = true, idxOn = 0, idxMNN = 1, idxDur = 3
){
  // Tom Collins 11/1/2015.
  // This function converts a compObj variable to an array consisting of
  // json variables. Each json variable contains state and context information
  // for a segment of the input compObj variable. This can then be analysed
  // (by another function) for possible continuations between states in one or
  // more pieces.

  var idxMNN = 1;
  var out_array = [];
  if (compObj.timeSignatures.length > 1){
    console.log("More than one time signature in this piece.");
    console.log("Might not be the best idea to analyse with this function.");
    console.log("Stopping analysis for this piece.");
    return out_array;
  }
  else{
    var D = mu.comp_obj2note_point_set(compObj);
    var segD = mu.segment(D, onAndOff, idxOn, idxDur);

    // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
    var fifth_steps = compObj.keySignatures[0].fifthSteps;
    var mode = compObj.keySignatures[0].mode;
    var trans_pair_and_c_point_set = centre_point_set(
      [fifth_steps, mode], mu.copy_point_set(D)
    );
    var trans_pair = trans_pair_and_c_point_set[0];
    // console.log('trans_pair:');
    // console.log(trans_pair);
    var E = trans_pair_and_c_point_set[1];
    var segE = mu.segment(E, onAndOff, idxOn, idxDur);
    // console.log('segments:');
    // console.log(segE);

    // Iterate over segE, converting the ontime of each segment to a beat
    // number and extracting the relative MIDI note numbers.
    for (i = 0; i < segE.length; i++){
      var bar_beat = mu.bar_and_beat_number_of_ontime(
        segE[i].ontime, compObj.timeSignatures
      );
      // This is beat of the bar in crotchet beats rounded to 5 decimal places.
      var beat_round = Math.round(bar_beat[1]*100000)/100000;
      var rel_MNN = new Array(segE[i].points.length)
      for (j = 0; j < segE[i].points.length; j++){
        rel_MNN[j] = segE[i].points[j][idxMNN];
      }
      // Sort the rel_MNN entries and retain only the unique members.
      var unqAndIdx = mu.unique_rows(rel_MNN.map(function(m){ return [m] }))
      var unqRelMNN = unqAndIdx[0].map(function(arr){ return arr[0] })
      // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
      var mapSwitch = new Array(rel_MNN.length)
      unqAndIdx[1].map(function(arr, idx){
        arr.map(function(el){
          mapSwitch[el] = idx
        })
      })
      // var unqRelMNN = mu.get_unique(
      //   rel_MNN.sort(function(a, b) { return a - b; })
      // );

      // Tuplets in scores can cause rounding errors when states are created, so
      // check for very small time differences between consecutive states, and
      // ignore a state if it is followed really soon after by another.
      // ***************************************************
      // 20200218. Get rid of rest states. They add noise. *
      // ***************************************************
      if (segE[i].offtime - segE[i].ontime >= .00002 && unqRelMNN.length > 0){
        out_array.push({
          "beat_rel_MNN_state": [beat_round, unqRelMNN],
          "context": {
            "piece_id": compObj.id,
            "orig_points": segD[i].points,
            "map_into_state": mapSwitch,
            "tonic_pitch_closest": trans_pair,
            "fifth_steps_mode": [fifth_steps, mode]
          }
        });
      }
      // else {
      //   console.log('A state was thrown out because of being followed really' +
      //   ' soon after by another.');
      //   console.log('segE[i]:');
      //   console.log(segE[i]);
      //   console.log('segE[i + 1]:');
      //   console.log(segE[i + 1]);
      // }
    }
    return out_array;
  }
}
// exports.comp_obj2beat_rel_mnn_states = comp_obj2beat_rel_mnn_states

function comp_obj2beat_rel_sq_mnn_states(
  compObj, onAndOff = true, squashRange = 12, idxOn = 0, idxMNN = 1, idxDur = 3
){
  // Tom Collins 26/2/2020.
  // This function converts a compObj variable to an array consisting of
  // json variables. Each json variable contains state and context information
  // for a segment of the input compObj variable. This can then be analysed
  // (by another function) for possible continuations between states in one or
  // more pieces.

  var idxMNN = 1;
  var out_array = [];
  if (compObj.timeSignatures.length > 1){
    console.log("More than one time signature in this piece.");
    console.log("Might not be the best idea to analyse with this function.");
    console.log("Stopping analysis for this piece.");
    return out_array;
  }
  else{
    var D = mu.comp_obj2note_point_set(compObj);
    var segD = mu.segment(D, onAndOff, idxOn, idxDur);

    // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
    var fifth_steps = compObj.keySignatures[0].fifthSteps;
    var mode = compObj.keySignatures[0].mode;
    var trans_pair_and_c_point_set = centre_point_set(
      [fifth_steps, mode], mu.copy_point_set(D)
    );
    var trans_pair = trans_pair_and_c_point_set[0];
    // console.log('trans_pair:');
    // console.log(trans_pair);
    var E = trans_pair_and_c_point_set[1];
    var segE = mu.segment(E, onAndOff, idxOn, idxDur);
    // console.log('segments:');
    // console.log(segE);

    // Iterate over segE, converting the ontime of each segment to a beat
    // number and extracting the relative MIDI note numbers.
    for (i = 0; i < segE.length; i++){
      var bar_beat = mu.bar_and_beat_number_of_ontime(
        segE[i].ontime, compObj.timeSignatures
      );
      // This is beat of the bar in crotchet beats rounded to 5 decimal places.
      var beat_round = Math.round(bar_beat[1]*100000)/100000;
      var rel_sq_MNN = new Array(segE[i].points.length);
      for (j = 0; j < segE[i].points.length; j++){
        // console.log("j:", j)
        //*************
        // Squashing! *
        //*************
        let m = segE[i].points[j][idxMNN]
        // console.log("m:", m)
        while (m > squashRange || m < -squashRange){
          if (m > squashRange){
            m -= squashRange
          }
          else {
            m += squashRange
          }
        }
        rel_sq_MNN[j] = m;
      }
      // Sort the rel_sq_MNN entries and retain only the unique members.
      var unqAndIdx = mu.unique_rows(rel_sq_MNN.map(function(m){ return [m] }))
      var unq_rel_sq_MNN = unqAndIdx[0].map(function(arr){ return arr[0] })
      // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
      var mapSwitch = new Array(rel_sq_MNN.length)
      unqAndIdx[1].map(function(arr, idx){
        arr.map(function(el){
          mapSwitch[el] = idx
        })
      })
      // var unq_rel_sq_MNN = mu.get_unique(
      //   unq_rel_sq_MNN.sort(function(a, b) { return a - b; })
      // );

      // Tuplets in scores can cause rounding errors when states are created, so
      // check for very small time differences between consecutive states, and
      // ignore a state if it is followed really soon after by another.
      // ***************************************************
      // 20200218. Get rid of rest states. They add noise. *
      // ***************************************************
      if (segE[i].offtime - segE[i].ontime >= .00002 && rel_sq_MNN.length > 0){
        out_array.push({
          "beat_rel_sq_MNN_state": [beat_round, unq_rel_sq_MNN],
          "context": {
            "piece_id": compObj.id,
            "orig_points": segD[i].points,
            "map_into_state": mapSwitch,
            "tonic_pitch_closest": trans_pair,
            "fifth_steps_mode": [fifth_steps, mode]
          }
        });
      }
      // else {
      //   console.log('A state was thrown out because of being followed really' +
      //   ' soon after by another.');
      //   console.log('segE[i]:');
      //   console.log(segE[i]);
      //   console.log('segE[i + 1]:');
      //   console.log(segE[i + 1]);
      // }
    }
    return out_array;
  }
}

// // Example:
// var compObj = {
//  "id":"KO3S1U",
//  "name":"If ye love me",
//  "composers": [
//    { "id":"HH123J", "name":"tallis_thomas", "displayName":"Thomas Tallis" }
//  ],
//  "keySignatures": [
//    { "barNo":1, "keyName":"F major", "fifthSteps":-1, "mode":0, "ontime":0 }
//  ],
//  "timeSignatures": [
//    { "barNo":1, "topNo":4, "bottomNo":4, "ontime":0 }
//  ],
//  "notes": [
//    { "ID":"3",
//      "ontime":0, "duration":3, "offtime":3,
//      "barOn":1, "beatOn":1, "barOff":1, "beatOff":4,
//      "pitch":"F4", "MNN":65, "MPN":63,
//      "staffNo":0, "voiceNo":1 },
//    { "ID":"53",
//      "ontime":3, "duration":1, "offtime":4,
//      "barOn":1, "beatOn":4, "barOff":2, "beatOff":1,
//      "pitch":"F4", "MNN":65, "MPN":63,
//      "staffNo":0, "voiceNo":1 },
//    { "ID":"10",
//      "ontime":4, "duration":2, "offtime":6,
//      "barOn":2, "beatOn":1, "barOff":2, "beatOff":3,
//      "pitch":"G4", "MNN":67, "MPN":64,
//      "staffNo":0, "voiceNo":1 },
//    { "ID":"32",
//      "ontime":4, "duration":2, "offtime":6,
//      "barOn":2, "beatOn":1, "barOff":2, "beatOff":3,
//      "pitch":"Bb4", "MNN":70, "MPN":66,
//      "staffNo":0, "voiceNo":1 }
//  ]
// }
// var ans = comp_obj2beat_rel_mnn_states(compObj);
// console.log("ans[0]:", ans[0]);
// console.log("ans[1]:", ans[1]);
// console.log("ans[2]:", ans[2]);
// // Should give:
// // [[1, [0]], [4, [0]], [1, [2, 5]]].


function lyrics_obj2lyrics_states(lyricsObj){
  // Tom Collins 11/1/2015.
  // This function converts a lyricsObj variable to an array consisting of
  // json variables. Each json variable contains state and context information
  // for a segment of the input lyricsObj variable. This can then be analysed
  // (by another function) for possible continuations between states in one or
  // more pieces.

  var out_array = []
  lyricsObj.lyricsArr.forEach(function(line, idx){
    line.forEach(function(word, jdx){
      let state = []
      state.push(word)
      if (jdx < line.length - 1){
        state.push(line[jdx + 1])
      }
      else {
        if (idx < lyricsObj.lyricsArr.length - 1){
          state.push(lyricsObj.lyricsArr[idx + 1][0])
        }
      }
      if (state.length == 2){
        out_array.push({
          "lyrics_state": state,
          "context": {
            "piece_id": lyricsObj.id,
            "index_in_line": jdx
          }
        })
      }
    })
  })
  return out_array
}


// Tom Collins 27/1/2015.
// This function takes an array of json_score variables as input, and
// constructs an array known as a state transition matrix. In reality, it is
// an array not a matrix: an array of objects where each object contains a
// beat_MNN_state property and a continuations property. The beat_MNN_state
// property value is an array, something like
// [1, [42, 60]], which means a musical event/segment that begins on beat 1
// of the bar and consists of two MIDI note numbers, 42 and 60. The
// continuations property value is an array consisting of state-context
// pairs: it is all the events/segments that follow on from [1, [42, 60]],
// say, in the json_score variables.
function construct_stm(compObjs, param){
  const stateType = param.stateType
  const onAndOff = param.onAndOff
  const squashRange = param.squashRangeMidi

  // Could check that each of the compObjs have just one time signature, and
  // that they are all equal to one another...

  var nscr = compObjs.length;
  var state_context_pairs = [];
  for (iscr = 0; iscr < nscr; iscr++){
    switch (stateType){
      case "beat_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_mnn_states(
        compObjs[iscr],
        onAndOff
      );
      break;
      case "beat_rel_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_rel_mnn_states(
        compObjs[iscr],
        onAndOff
      );
      break;
      case "beat_rel_sq_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_rel_sq_mnn_states(
        compObjs[iscr],
        onAndOff,
        squashRange
      );
      break;
      case "lyrics_state":
      state_context_pairs[iscr] = lyrics_obj2lyrics_states(compObjs[iscr]);
      break;
      default:
      console.log("SHOULD NOT GET HERE!")
    }
    //if (iscr == 0){
    //  console.log('state_context_pairs[iscr]:', state_context_pairs[iscr]);
    //}
  }

  var stm = [];
  for (iscr = 0; iscr < nscr; iscr++){
    for (jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
      // console.log('Curr state:');
      // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
      var rel_idx = mu.array_object_index_of_array(
        stm, state_context_pairs[iscr][jstate][stateType], stateType
      );
      if (rel_idx >= 0){
        // The current state already appears in the stm. Push its continuation
        // to the array of continuations for this state.
        stm[rel_idx]["continuations"].push(state_context_pairs[iscr][jstate + 1]);
      }
      else {
        // The current state has not appeared in the stm before. Push it and
        // its first continuation observed here to the stm.
        var newObj = {}
        newObj[stateType] = state_context_pairs[iscr][jstate][stateType]
        newObj.continuations = [state_context_pairs[iscr][jstate + 1]]
        stm.push(newObj);
      }
    }
    // console.log('Completed processing composition ' + iscr);
  }
  return stm;
}
exports.construct_stm = construct_stm;


function prune_stm(stm, param){
  const stateType = param.stateType
  const nosConsecutives = param.nosConsecutives

  // Identify dead-ends.
  stm.map(function(stateConts, idx){
    if (idx % 500 == 0){
      console.log("Pruning at index " + idx + " of " + stm.length + ".")
    }
    stateConts.deadEnd = prune_helper(stateConts, stm, stateType, nosConsecutives)
  })
  // console.log("Dead-ends identified, stm.length:", stm.length)
  // Remove them and associated continuations.
  for (let i = stm.length - 1; i >= 0; i--){
    if (i % 500 == 0){
      console.log("Checking removal need at index " + i + " of " + stm.length + ".")
    }
    if (stm[i].deadEnd){
      stm = prune_remover(stm[i][stateType], stm, stateType)
    }
  }
  // console.log("Dead-ends and associated continuations removed, stm.length:", stm.length)
  // Remove any states whose continuations array is now of length zero.
  for (let i = stm.length - 1; i >= 0; i--){
    if (i % 500 == 0){
      console.log("Checking continuations length at " + i + " of " + stm.length + ".")
    }
    if (stm[i].continuations.length == 0){
      stm.splice(i, 1)
    }
  }
  // Delete deadEnd properties, since we're done with them now.
  stm = stm.map(function(stateConts){
    delete stateConts.deadEnd
    return stateConts
  })
  return stm
}
exports.prune_stm = prune_stm


function prune_helper(stateConts, stm, stateType, nosConsecutives){
  let pruneAns = [] // Defining as an array to enforce pass by reference.
  prune_helper_2(stateConts, stm, stateType, nosConsecutives, pruneAns)
  // if (pruneAns.length > 1){
  //   console.log("NOT SURE THIS SHOULD GROW TO LENGTH 2+!")
  // }
  return pruneAns[0]
}
exports.prune_helper = prune_helper


function prune_helper_2(stateConts, stm, stateType, nosConsecutives, pruneAns, consecCount = 0){
  // console.log("consecCount:", consecCount)
  if (consecCount == nosConsecutives){
    // We reached the limit of how far we can go from the original state without
    // encountering at least one other different piece_id, so the original state
    // is considered a dead end for this value of nosConsecutives.
    pruneAns.push(true)
    return
  }
  const unqIds = mu.get_unique(
    stateConts["continuations"].map(function(c){ return c.context.piece_id })
  )
  // console.log("unqIds:", unqIds)
  if (unqIds.length > 1){
    // At least one other different piece_id, so we're good.
    pruneAns.push(false)
    return
  }
  stateConts["continuations"].forEach(function(c){
    // Keep looking for each continuation of this state.
    // console.log("c[stateType]:", c[stateType])
    const relIdx = mu.array_object_index_of_array(stm, c[stateType], stateType)
    // console.log("relIdx:", relIdx)
    if (relIdx >= 0){
      prune_helper_2(stm[relIdx], stm, stateType, nosConsecutives, pruneAns, consecCount + 1)
    }
    // If we get here, then a terminal state must have been encountered.
    // console.log("Terminal state encountered!")
  })
}


function prune_remover(state, stm, stateType){
  // Remove all occurrences of the dead-end state from continuations.
  const relIdx = mu.array_object_index_of_array(stm, state, stateType)
  stm = stm.map(function(sc){
    sc.continuations = sc.continuations.filter(function(c){
      return !c[stateType].equals(state)
    })
    return sc
  })
  // Remove the state itself from the stm.
  stm.splice(relIdx, 1)
  return stm
}
exports.prune_remover = prune_remover


function note_point_set2comp_obj(
  ps, timeSigs = [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}],
  isPerc = false, f = mu.farey(4),
  onIdx = 0, mnnIdx = 1, durIdx = 3, chanIdx = 4, velIdx = 5
){
  var comp = {};
  var notes = [];
  var maxInd;
  // Split up MIDI notes by channel number.
  var unqChan = [];
  var psByChan = [];
  ps.map(function(n){
    if (unqChan.indexOf(n[chanIdx]) === -1){
      unqChan.push(n[chanIdx]);
      psByChan[n[chanIdx]] = [n];
    }
    else {
      psByChan[n[chanIdx]].push(n);
    }
    return;
  });
  // console.log("unqChan:", unqChan);
  // console.log("psByChan:", psByChan);
  var numTracks = 0;
  comp["layer"] = [];
  unqChan.map(function(track, ind){
    numTracks++;
    comp.layer.push({ staffNo: track });
    return;
  });
  // console.log("comp.layer:", comp.layer);
  // console.log("numTracks:", numTracks);
  if (numTracks === 0){
    console.log("No tracks found in this MIDI file.");
    return;
  }

  comp["layer"] = comp["layer"].map(function(track, layerNum){
    var layer = {};
    if (track == 10){
      layer["idInstrument"] = "edm_drum_kit"
    }
    else {
      layer["idInstrument"] = "acoustic_grand_piano"
    }
    // layer["idInstrument"] = assign_instrument_basic(track)
    // This won"t work because we"re no longer importing from MIDI.
    // console.log("track.instrumentNumber:", track.instrumentNumber);
    // layer["idInstrument"] = an.assign_instrument_basic(track.instrumentNumber)
    layer["staffNo"] = layerNum
    layer["timestampLastUsed"] = ""
    layer["vexflow"] = { "name": "", "abbreviation": "", "staffOrderNo": layerNum }
    // This won't work because we're no longer importing from MIDI.
    // layer["vexflow"] = { "name": track.name || "", "abbreviation": "", "staffOrderNo": layerNum }
    if (psByChan[track.staffNo] !== undefined){
      // Get the track.notes and quantise them.
      var ps2 = psByChan[track.staffNo].filter(function(note){
        // Get rid of quiet notes.
        return note[velIdx] > 0.05;
      })
      // .map(function(note){
      //   return [
      //     note[0],
      //     note[1],
      //     note[2],
      //     note[3],
      //     note[4]
      //   ];
      // })
      .filter(function(p){ // Gets rid of really low/high notes.
        return p[mnnIdx] >= 21 && p[mnnIdx] <= 108;
      });
      // console.log("unquantised ps2.slice(0, 3):", ps2.slice(0, 3))
      ps2 = mu.farey_quantise(ps2, f, [onIdx, durIdx]);
      // console.log("quantised ps2.slice(0, 3):", ps2.slice(0, 3))
      notes = notes.concat(ps2.map(function(p){
        // console.log("note:", note);
        var compNote = {}
        compNote["id"] = uu()
        compNote["ontime"] = p[onIdx]
        if (p[durIdx] > 8){
          compNote["duration"] = 8;
          // console.log("Long duration corrected.")
        }
        else {
          compNote["duration"] = p[durIdx]
        }
        compNote["offtime"] = compNote.ontime + compNote.duration
        var barBeat = mu.bar_and_beat_number_of_ontime(compNote.ontime, timeSigs)
        compNote["barOn"] = barBeat[0]
        compNote["beatOn"] = barBeat[1]
        barBeat = mu.bar_and_beat_number_of_ontime(compNote.offtime, timeSigs)
        compNote["barOff"] = barBeat[0]
        compNote["beatOff"] = barBeat[1]
        // compNote["pitch"] = note.name
        compNote["MNN"] = p[mnnIdx]
        // compNote["MPN"] = 0
        compNote["staffNo"] = p[chanIdx]
        compNote["tonejs"] = {
          "volume": p[velIdx] // Math.round(100*p[velIdx]/127)/100
        }
        compNote["voiceNo"] = 0
        // compNote["isPerc"] = true
        return compNote
      }))
      // console.log("notes.slice(0, 10):", notes.slice(0, 10));
    }
    return layer
  })
  // console.log("notes.length:", notes.length);

  var keySig
  if (!isPerc){
    keySig = mu.fifth_steps_mode(ps, mu.krumhansl_and_kessler_key_profiles)
  }
  else {
    keySig = ["C major", 1, 0, 0]
  }
  comp["keySignatures"] = [{
    "barNo": 1,
    "keyName": keySig[0],
    "fifthSteps": keySig[2],
    "mode": keySig[3],
    "ontime": 0
  }]
  // console.log("keySig:", keySig);
  comp["timeSignatures"] = timeSigs
  // Guess note names.
  notes.forEach(function (note) {
    note["MPN"] = mu.guess_morphetic(note.MNN, keySig[2], keySig[3])
    note["pitch"] = mu.midi_note_morphetic_pair2pitch_and_octave(note.MNN, note.MPN)
  })
  comp["notes"] = notes.sort(mu.sort_points_asc);
  // comp["sequencing"] = [{"ontime": 0, "offtime": 16, "repetitionNo": 1}]
  comp["tempi"] = [{"barNo": 1, "ontime": 0, "bpm": 120, "tempo": ""}]
  // comp["tempi"] = [{"barNo": 1, "ontime": 0, "bpm": midi.header.bpm, "tempo": ""}]
  return comp;
}
exports.note_point_set2comp_obj = note_point_set2comp_obj;


function centre_point_set(
  fifth_steps_mode, point_set, idxMNN = 1, idxMPN = 2
){
  // Tom Collins 26/1/2015.
  // Translates the point set so that the tonic pitch class closest to the mean
  // MIDI note number is represented by the pair [0, 0].

  var MNN_MPN_pair = fifth_steps_mode2MNN_MPN(fifth_steps_mode);
  // console.log("MNN_MPN_pair:", MNN_MPN_pair)

  // Find the MIDI note number of the tonic pitch class closest to the mean
  // MIDI note number of the piece. Start by finding the mean MNN.
  var MNNs = [];
  for (i = 0; i < point_set.length; i++){
    MNNs.push(point_set[i][1]);
  }
  var MNN_mu = mu.mean(MNNs);
  // console.log('Mean MNN:');
  // console.log(MNN_mu);

  // Get the MNNs for all the tonic pitch classes.
  var MNN_tonal=[];
  for(var i = MNN_MPN_pair[0] - 60; i <= MNN_MPN_pair[0] + 72; i = i + 12){
    MNN_tonal[MNN_tonal.length] = i;
  }

  // Now find the MNN of the tonic pitch class closest to the mean MNN.
  var dist = [];
  var n_tonal = MNN_tonal.length;
  for (i = 0; i < n_tonal; i++){
    dist[i] = Math.abs(MNN_tonal[i] - MNN_mu);
  }
  var min_stuff = mu.min_argmin(dist);
  var trans_pair = [
    MNN_MPN_pair[0] + 12*(min_stuff[1] - 5),
    MNN_MPN_pair[1] + 7*(min_stuff[1] - 5)
  ];

  for (i = 0; i < point_set.length; i++){
    var new_MNN = point_set[i][idxMNN] - trans_pair[0];
    var new_MPN = point_set[i][idxMPN] - trans_pair[1];
    point_set[i].splice(idxMNN, 1, new_MNN);
    point_set[i].splice(idxMPN, 1, new_MPN);
  }
  return [trans_pair, point_set];
}
exports.centre_point_set = centre_point_set;


function construct_initial(compObjs, param){
  const stateType = param.stateType
  const onAndOff = param.onAndOff
  const squashRange = param.squashRangeMidi

  // Could check that each of the compObjs have just one time signature, and
  // that they are all equal to one another...

  var nscr = compObjs.length;
  var state_context_pairs = [];
  for (iscr = 0; iscr < nscr; iscr++){
    switch (stateType){
      case "beat_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_mnn_states(
        compObjs[iscr],
        onAndOff
      );
      break;
      case "beat_rel_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_rel_mnn_states(
        compObjs[iscr],
        onAndOff
      );
      break;
      case "beat_rel_sq_MNN_state":
      state_context_pairs[iscr] = comp_obj2beat_rel_sq_mnn_states(
        compObjs[iscr],
        onAndOff,
        squashRange
      );
      break;
      case "lyrics_state":
      state_context_pairs[iscr] = lyrics_obj2lyrics_states(compObjs[iscr]);
      break;
      default:
      console.log("SHOULD NOT GET HERE!")
    }
    //if (iscr == 0){
    //  console.log('state_context_pairs[iscr]:', state_context_pairs[iscr]);
    //}
  }

  var initial = []
  if (stateType == "lyrics_state"){
    for (iscr = 0; iscr < nscr; iscr++){
      for (jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
        // console.log('Curr state:');
        // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
        let scPair = state_context_pairs[iscr][jstate]
        if (scPair.context.index_in_line == 0){
          initial.push(scPair)
        }
      }
    }
  }
  else {
    for (iscr = 0; iscr < nscr; iscr++){
      for (jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
        // console.log('Curr state:');
        // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
        let scPair = state_context_pairs[iscr][jstate]
        if (scPair[stateType][0] == 1){
          initial.push(scPair)
        }
      }
    }
  }
  return initial;
}
exports.construct_initial = construct_initial


function prune_initial(initialDistbn, stm, param){
  const stateType = param.stateType

  return initialDistbn.filter(function(scPair){
    return mu.array_object_index_of_array(
      stm, scPair[stateType], stateType
    ) >= 0
  })
}
exports.prune_initial = prune_initial;

// Example:
// var point_set = [[0, 63, 62, 3/4, 0], [3/4, 63, 62, 1/4, 0],
//                 [1, 65, 63, 3/4, 0], [7/4, 63, 62, 1/4, 0], [2, 67, 64, 1, 0],
//                 [3, 65, 63, 3/4, 0], [15/4, 63, 62, 1/4, 0],
//                 [4, 67, 64, 1, 0], [5, 65, 63, 3/4, 0],
//                 [23/4, 63, 62, 1/4, 0], [6, 67, 64, 1, 0], [7, 65, 63, 1, 0],
//                 [35/4, 63, 62, 1/4, 0], [9, 65, 63, 3/4, 0],
//                 [39/4, 63, 62, 1/4, 0], [10, 67, 64, 3/4, 0],
//                 [43/4, 65, 63, 1/4, 0], [11, 63, 62, 1, 0]];
// var ans = centre_point_set([-3, 0], point_set);
// console.log(ans); // Should give:
//[[0, 0, 0, 3/4, 0], [3/4, 0, 0, 1/4, 0], [1, 2, 1, 3/4, 0],
// [7/4, 0, 0, 1/4, 0], [2, 4, 2, 1, 0], [3, 2, 1, 3/4, 0],
// [15/4, 0, 0, 1/4, 0], [4, 4, 2, 1, 0], [5, 2, 1, 3/4, 0],
// [23/4, 0, 0, 1/4, 0], [6, 4, 2, 1, 0], [7, 2, 1, 1, 0],
// [35/4, 0, 0, 1/4, 0], [9, 2, 1, 3/4, 0], [39/4, 0, 0, 1/4, 0],
// [10, 4, 2, 3/4, 0], [43/4, 2, 1, 1/4, 0], [11, 0, 0, 1, 0]];


function fifth_steps_mode2MNN_MPN(fifth_steps_mode){
  // Tom Collins 26/1/2015.
  // A pair consisting of position on the circle of fifths and mode (0 for
  // Ionian, 1 for Dorian, etc.) is converted to a pair consisting of a MIDI
  // note number and morphetic pitch number for the tonic.

  var conversion = [// Major keys (Ionian modes).
    [[0, 0], [60, 60]], [[1, 0], [67, 64]], [[2, 0], [62, 61]],
    [[3, 0], [69, 65]], [[4, 0], [64, 62]], [[5, 0], [71, 66]],
    [[6, 0], [66, 63]], [[7, 0], [61, 60]], [[8, 0], [68, 64]],
    [[9, 0], [63, 61]], [[10, 0], [70, 65]],
    [[-1, 0], [65, 63]], [[-2, 0], [70, 66]],
    [[-3, 0], [63, 62]], [[-4, 0], [68, 65]],
    [[-5, 0], [61, 61]], [[-6, 0], [66, 64]],
    [[-7, 0], [71, 67]], [[-8, 0], [64, 63]],
    // Minor keys (Aeolian modes).
    [[0, 5], [63, 62]], [[1, 5], [70, 66]], [[2, 5], [65, 63]],
    [[3, 5], [60, 60]], [[4, 5], [67, 64]], [[5, 5], [62, 61]],
    [[6, 5], [69, 65]], [[7, 5], [64, 62]], [[8, 5], [71, 66]],
    [[9, 5], [66, 63]], [[-1, 5], [68, 65]],
    [[-2, 5], [61, 61]], [[-3, 5], [66, 64]],
    [[-4, 5], [71, 66]], [[-5, 5], [64, 62]],
    [[-6, 5], [69, 65]]
  ];
  var i = 0;
  while (i < conversion.length){
    if (
      conversion[i][0][0] == fifth_steps_mode[0] &&
      conversion[i][0][1] == fifth_steps_mode[1]
    ){
      var MNN_MPN_pair = conversion[i][1];
      i = conversion.length;
    }
    else{
      i++;
    }
  }
  return MNN_MPN_pair;
}


function string2lyrics(str){
  // Retain characters that are alphanumeric, a space, or a line break.
  let lines = str.split("\n")
  // Get rid of multiple line breaks.
  .filter(function(line){
    return line.length > 0
  })
  .map(function(line){
    let words = line.replace(/[^a-z0-9\ ]/gi, "").toLowerCase()
    return words.split("\ ")
  })
  // console.log("lines:", lines)
  return lines
}
exports.string2lyrics = string2lyrics


function state2string(state){
  // Tom Collins 26/5/2020.
  // Assumption here is that the state will be of the form
  // [1, [ -7, -3, 0, 12 ]]
  // and the output will be of the form
  // "1|-7,-3,0,12"

  return state[0] + "|" + state[1]
  // state[1].map(function(m, idx){
  //   if (idx == state[1].length - 1){
  //     return m
  //   }
  //   return m + ","
  // })
}
exports.state2string = state2string


function string2state(str){
  // Tom Collins 26/5/2020.
  // Assumption here is that the string will be of the form
  // "1|-7,-3,0,12"
  // and the output will be of the form
  // [1, [ -7, -3, 0, 12 ]]

  let split = str.split("|")
  let arrStr = split[1].split(",")
  return [
    parseFloat(split[0]),
    arrStr.map(function(num){
      return parseInt(num)
    })
  ]
}
exports.string2state = string2state




// Not sure if this and the next one are used...
function write2csv(notes, path, folder, filename){
  var arr_out = notes.map(function(n){
    return [
      Math.round(n.ontime*100000)/100000,
      n.MNN,
      n.MPN,
      Math.round(n.duration*100000)/100000,
      n.staffNo
    ];
  });
  var str = "";
  arr_out.map(function(p){
    var p_str = "";
    p.map(function(v){
      p_str = p_str + v.toString() + ",";
      return;
    });
    p_str = p_str.slice(0, p_str.length - 1) + "\n";
    str = str.concat(p_str);
    return;
  });
  // console.log("str.slice(0, 100):", str.slice(0, 100));
  fs.writeFileSync(path + folder + "/" + filename + ".csv", str)
}

function place_and_save(aComp, truncation, aMin, fnam, mode, continuation_length){
  // Gives the composition a unique id.
  aComp["id"] = uu()
  // Places notes so they start at time zero.
  if (truncation) {
    aComp.notes.forEach(function (note) {
      note.ontime -= aMin
      note.offtime -= aMin
      // Reduce any weirdly long notes to max of 2 measures.
      if (note.duration > 8){
        note.duration = 8;
        note.offtime = note.ontime + note.duration;
      }
    })
  }
  // Saves composition(s) to DB.
  //new CompositionModel(aComp)
  //.save()
  //.then(function (composition) {
  //  console.log(
  //    "idLakh: ", composition.idLakh,
  //    "mode: ", mode,
  //    "contLength: ", continuation_length,
  //    "id: ", composition.id
  //  );
  //})
}

// Tom Collins 3/6/2018.
// The purpose of this function is to assign a Jam! instrument id to an
// incoming instrument number, which conform to the standard program
// change events listed here:
// https://en.wikipedia.org/wiki/General_MIDI#Program_change_events
// As we add more instruments to our database, I'm hoping we can change many
// of the repeated instrument ids in the lookup variable to more accurate
// assignments.
function assign_instrument_basic(instrNum){
  var lookup = [
    // 1.
    "acoustic_grand_piano", // Yes!
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 6.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 11.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 16.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 21.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_guitar_nylon", // Yes!
    // 26.
    "acoustic_guitar_nylon",
    "clean_electric_guitar_2",
    "clean_electric_guitar_2",
    "clean_electric_guitar_2",
    "distortion_guitar",
    // 31.
    "distortion_guitar",
    "distortion_guitar",
    "acoustic_bass", // Yes!
    "electric_bass_finger",
    "electric_bass_finger",
    // 36.
    "electric_bass_finger",
    "electric_bass_finger",
    "electric_bass_finger",
    "synth_bass",
    "synth_bass_2",
    // 41.
    "cello",
    "cello",
    "cello", // Yes!
    "cello",
    "cello",
    // 46.
    "cello",
    "cello",
    "cello",
    "cello",
    "cello",
    // 51.
    "cello",
    "cello",
    "cello",
    "cello",
    "cello",
    // 56.
    "cello",
    "trumpet", // Yes!
    "trumpet",
    "trumpet",
    "trumpet",
    // 61.
    "trumpet",
    "trumpet",
    "trumpet",
    "trumpet",
    "trumpet",
    // 66.
    "trumpet",
    "trumpet",
    "trumpet",
    "english_horn",
    "english_horn",
    // 71.
    "english_horn",
    "clarient", // Yes!
    "flute",
    "flute",
    "flute",
    // 76.
    "flute",
    "flute",
    "flute",
    "flute",
    "flute",
    // 81.
    "am_synth_6",
    "am_synth_5",
    "am_synth_4",
    "am_synth_3",
    "am_synth_2",
    // 86.
    "am_synth_2",
    "am_synth_2",
    "am_synth",
    "fm_synth_6",
    "fm_synth_5",
    // 91.
    "fm_synth_4",
    "fm_synth_3",
    "fm_synth_2",
    "fm_synth_2",
    "fm_synth_2",
    // 96.
    "fm_synth",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 101.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "sitar",
    // 106.
    "sitar",
    "sitar",
    "sitar",
    "sitar",
    "sitar",
    // 111.
    "sitar",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 116.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 121.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    // 126.
    "acoustic_grand_piano",
    "acoustic_grand_piano",
    "acoustic_grand_piano"
  ];

  if (instrNum < 0 || instrNum > 127){
    return "acoustic_grand_piano";
  }
  else {
    return lookup[instrNum];
  }
};
