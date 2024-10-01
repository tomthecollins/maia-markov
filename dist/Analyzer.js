'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Analyzer;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Imports
// import 'maia-util'
// import mu from 'maia-util'
var fs = require('fs');
var path = require('path');
var mu = require('maia-util');
// const uu = require('uuid')

// Constructor for Analyzer object
function Analyzer() {}
// Workaround for JS context peculiarities.
// var self = this;
// Possible to return something.
// return sth;

// Methods for Analyzer object
Analyzer.prototype = {
  constructor: Analyzer,

  comp_obj2beat_mnn_states: function comp_obj2beat_mnn_states(compObj) {
    var onAndOff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var idxOn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var idxMNN = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var idxDur = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;

    // Tom Collins 11/1/2015.
    // This function converts a compObj variable to an array consisting of
    // json variables. Each json variable contains state and context information
    // for a segment of the input compObj variable. This can then be analysed
    // (by another function) for possible continuations between states in one or
    // more pieces.

    var out_array = [];
    // console.log('compObj:');
    // console.log(compObj);
    if (compObj.timeSignatures.length > 1) {
      console.log("More than one time signature in this piece.");
      console.log("Might not be the best idea to analyse with this function.");
      console.log("Stopping analysis for this piece.");
      return out_array;
    } else {
      var D = mu.comp_obj2note_point_set(compObj);
      var segE = mu.segment(D, onAndOff, idxOn, idxDur);

      // Iterate over segE, converting the ontime of each segment to a beat
      // number and extracting the MIDI note numbers.
      for (var i = 0; i < segE.length; i++) {
        var bar_beat = mu.bar_and_beat_number_of_ontime(segE[i].ontime, compObj.timeSignatures);
        // This is beat of the bar in crotchet beats rounded to 5 decimal places.
        var beat_round = Math.round(bar_beat[1] * 100000) / 100000;
        var MNN = new Array(segE[i].points.length);
        for (var j = 0; j < segE[i].points.length; j++) {
          MNN[j] = segE[i].points[j][idxMNN];
        }
        // Sort the MNN_rel entries and retain only the unique members.
        var unqAndIdx = mu.unique_rows(MNN.map(function (m) {
          return [m];
        }));
        var unqMNN = unqAndIdx[0].map(function (arr) {
          return arr[0];
        });
        // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
        var mapSwitch = new Array(MNN.length);
        unqAndIdx[1].map(function (arr, idx) {
          arr.map(function (el) {
            mapSwitch[el] = idx;
          });
        });
        // var unqMNN = mu.get_unique(
        //   MNN_rel.sort(function(a, b) { return a - b; })
        // );

        // Tuplets in scores can cause rounding errors when states are created, so
        // check for very small time differences between consecutive states, and
        // ignore a state if it is followed really soon after by another.
        // *********************************************************************
        // 20200218. Also now getting rid of rest states here. They add noise. *
        // *********************************************************************
        if (segE[i].offtime - segE[i].ontime >= .00002 && unqMNN.length > 0) {
          out_array.push({
            "beat_MNN_state": [beat_round, unqMNN],
            "context": {
              "piece_id": compObj.id,
              "orig_points": segE[i].points,
              "orig_ontime": segE[i].ontime, // Useful for identifying phrase boundaries.
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
  },

  comp_obj2beat_rel_mnn_states: function comp_obj2beat_rel_mnn_states(compObj) {
    var onAndOff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var idxOn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var idxMNN = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var idxDur = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;

    // Tom Collins 11/1/2015.
    // This function converts a compObj variable to an array consisting of
    // json variables. Each json variable contains state and context information
    // for a segment of the input compObj variable. This can then be analysed
    // (by another function) for possible continuations between states in one or
    // more pieces.

    var idxMNN = 1;
    var out_array = [];
    if (compObj.timeSignatures.length > 1) {
      console.log("More than one time signature in this piece.");
      console.log("Might not be the best idea to analyse with this function.");
      console.log("Stopping analysis for this piece.");
      return out_array;
    } else {
      var D = mu.comp_obj2note_point_set(compObj);
      var segD = mu.segment(D, onAndOff, idxOn, idxDur);

      // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
      var fifth_steps = compObj.keySignatures[0].fifthSteps;
      var mode = compObj.keySignatures[0].mode;
      var trans_pair_and_c_point_set = this.centre_point_set([fifth_steps, mode], mu.copy_point_set(D));
      var trans_pair = trans_pair_and_c_point_set[0];
      // console.log('trans_pair:');
      // console.log(trans_pair);
      var E = trans_pair_and_c_point_set[1];
      var segE = mu.segment(E, onAndOff, idxOn, idxDur);
      // console.log('segments:');
      // console.log(segE);

      // Iterate over segE, converting the ontime of each segment to a beat
      // number and extracting the relative MIDI note numbers.
      for (var i = 0; i < segE.length; i++) {
        var bar_beat = mu.bar_and_beat_number_of_ontime(segE[i].ontime, compObj.timeSignatures);
        // This is beat of the bar in crotchet beats rounded to 5 decimal places.
        var beat_round = Math.round(bar_beat[1] * 100000) / 100000;
        var rel_MNN = new Array(segE[i].points.length);
        for (var j = 0; j < segE[i].points.length; j++) {
          rel_MNN[j] = segE[i].points[j][idxMNN];
        }
        // Sort the rel_MNN entries and retain only the unique members.
        var unqAndIdx = mu.unique_rows(rel_MNN.map(function (m) {
          return [m];
        }));
        var unqRelMNN = unqAndIdx[0].map(function (arr) {
          return arr[0];
        });
        // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
        var mapSwitch = new Array(rel_MNN.length);
        unqAndIdx[1].map(function (arr, idx) {
          arr.map(function (el) {
            mapSwitch[el] = idx;
          });
        });
        // var unqRelMNN = mu.get_unique(
        //   rel_MNN.sort(function(a, b) { return a - b; })
        // );

        // Tuplets in scores can cause rounding errors when states are created, so
        // check for very small time differences between consecutive states, and
        // ignore a state if it is followed really soon after by another.
        // ***************************************************
        // 20200218. Get rid of rest states. They add noise. *
        // ***************************************************
        if (segE[i].offtime - segE[i].ontime >= .00002 && unqRelMNN.length > 0) {
          out_array.push({
            "beat_rel_MNN_state": [beat_round, unqRelMNN],
            "context": {
              "piece_id": compObj.id,
              "orig_points": segD[i].points,
              "orig_ontime": segD[i].ontime, // Useful for identifying phrase boundaries.
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
  },

  comp_obj2beat_rel_sq_mnn_states: function comp_obj2beat_rel_sq_mnn_states(compObj) {
    var onAndOff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var squashRange = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 12;
    var idxOn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var idxMNN = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var idxDur = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 3;

    // Tom Collins 26/2/2020.
    // This function converts a compObj variable to an array consisting of
    // json variables. Each json variable contains state and context information
    // for a segment of the input compObj variable. This can then be analysed
    // (by another function) for possible continuations between states in one or
    // more pieces.

    var idxMNN = 1;
    var out_array = [];
    if (compObj.timeSignatures.length > 1) {
      console.log("More than one time signature in this piece.");
      console.log("Might not be the best idea to analyse with this function.");
      console.log("Stopping analysis for this piece.");
      return out_array;
    } else {
      var D = mu.comp_obj2note_point_set(compObj);
      var segD = mu.segment(D, onAndOff, idxOn, idxDur);

      // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
      var fifth_steps = compObj.keySignatures[0].fifthSteps;
      var mode = compObj.keySignatures[0].mode;
      var trans_pair_and_c_point_set = this.centre_point_set([fifth_steps, mode], mu.copy_point_set(D));
      var trans_pair = trans_pair_and_c_point_set[0];
      // console.log('trans_pair:');
      // console.log(trans_pair);
      var E = trans_pair_and_c_point_set[1];
      var segE = mu.segment(E, onAndOff, idxOn, idxDur);
      // console.log('segments:');
      // console.log(segE);

      // Iterate over segE, converting the ontime of each segment to a beat
      // number and extracting the relative MIDI note numbers.
      for (var i = 0; i < segE.length; i++) {
        var bar_beat = mu.bar_and_beat_number_of_ontime(segE[i].ontime, compObj.timeSignatures);
        // This is beat of the bar in crotchet beats rounded to 5 decimal places.
        var beat_round = Math.round(bar_beat[1] * 100000) / 100000;
        var rel_sq_MNN = new Array(segE[i].points.length);
        for (var j = 0; j < segE[i].points.length; j++) {
          // console.log("j:", j)
          //*************
          // Squashing! *
          //*************
          var m = segE[i].points[j][idxMNN];
          // console.log("m:", m)
          while (m > squashRange || m < -squashRange) {
            if (m > squashRange) {
              m -= squashRange;
            } else {
              m += squashRange;
            }
          }
          rel_sq_MNN[j] = m;
        }
        // Sort the rel_sq_MNN entries and retain only the unique members.
        var unqAndIdx = mu.unique_rows(rel_sq_MNN.map(function (m) {
          return [m];
        }));
        var unq_rel_sq_MNN = unqAndIdx[0].map(function (arr) {
          return arr[0];
        });
        // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
        var mapSwitch = new Array(rel_sq_MNN.length);
        unqAndIdx[1].map(function (arr, idx) {
          arr.map(function (el) {
            mapSwitch[el] = idx;
          });
        });
        // var unq_rel_sq_MNN = mu.get_unique(
        //   unq_rel_sq_MNN.sort(function(a, b) { return a - b; })
        // );

        // Tuplets in scores can cause rounding errors when states are created, so
        // check for very small time differences between consecutive states, and
        // ignore a state if it is followed really soon after by another.
        // ***************************************************
        // 20200218. Get rid of rest states. They add noise. *
        // ***************************************************
        if (segE[i].offtime - segE[i].ontime >= .00002 && rel_sq_MNN.length > 0) {
          out_array.push({
            "beat_rel_sq_MNN_state": [beat_round, unq_rel_sq_MNN],
            "context": {
              "piece_id": compObj.id,
              "orig_points": segD[i].points,
              "orig_ontime": segD[i].ontime, // Useful for identifying phrase boundaries.
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
  },

  lyrics_obj2lyrics_states: function lyrics_obj2lyrics_states(lyricsObj) {
    // Tom Collins 11/1/2015.
    // This function converts a lyricsObj variable to an array consisting of
    // json variables. Each json variable contains state and context information
    // for a segment of the input lyricsObj variable. This can then be analysed
    // (by another function) for possible continuations between states in one or
    // more pieces.

    var out_array = [];
    lyricsObj.lyricsArr.forEach(function (line, idx) {
      line.forEach(function (word, jdx) {
        var state = [];
        state.push(word);
        if (jdx < line.length - 1) {
          state.push(line[jdx + 1]);
        } else {
          if (idx < lyricsObj.lyricsArr.length - 1) {
            state.push(lyricsObj.lyricsArr[idx + 1][0]);
          }
        }
        if (state.length == 2) {
          out_array.push({
            "lyrics_state": state,
            "context": {
              "piece_id": lyricsObj.id,
              "index_in_line": jdx
            }
          });
        }
      });
    });
    return out_array;
  },

  construct_prune_write_stm: function construct_prune_write_stm(_comps, _param) {
    var anStm = this.construct_stm(_comps, _param);
    console.log("anStm.length:", anStm.length);
    anStm = this.prune_stm(anStm, _param);
    console.log("pruned anStm.length:", anStm.length);
    if (anStm.length > 0) {
      // console.log("anStm[0].beat_mnn_state:", anStm[0].beat_mnn_state);
      // console.log("anStm.slice(0, 1):", anStm.slice(0, 1));
      fs.writeFileSync(path.join(_param.outPath, _param.filename + "_stm.js"), JSON.stringify(anStm) //, null, 2)
      );
      if (_param.stmTimer) {
        clearTimeout(_param.stmTimer);
      }
      return anStm;
    }
    // Else, return undefined.
  },

  construct_stm: function construct_stm(compObjs, param) {
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

    var stateType = param.stateType;
    var onAndOff = param.onAndOff;
    var squashRange = param.squashRangeMidi;

    // Could check that each of the compObjs have just one time signature, and
    // that they are all equal to one another...

    var nscr = compObjs.length;
    var state_context_pairs = [];
    for (var iscr = 0; iscr < nscr; iscr++) {
      switch (stateType) {
        case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(compObjs[iscr], onAndOff, squashRange);
          break;
        case "lyrics_state":
          state_context_pairs[iscr] = this.lyrics_obj2lyrics_states(compObjs[iscr]);
          break;
        default:
          console.log("SHOULD NOT GET HERE!");
      }
      //if (iscr == 0){
      //  console.log('state_context_pairs[iscr]:', state_context_pairs[iscr]);
      //}
    }

    var stm = [];
    for (var _iscr = 0; _iscr < nscr; _iscr++) {
      for (var jstate = 0; jstate < state_context_pairs[_iscr].length - 1; jstate++) {
        // console.log('Curr state:');
        // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
        var rel_idx = mu.array_object_index_of_array(stm, state_context_pairs[_iscr][jstate][stateType], stateType);
        if (rel_idx >= 0) {
          // The current state already appears in the stm. Push its continuation
          // to the array of continuations for this state.
          stm[rel_idx]["continuations"].push(state_context_pairs[_iscr][jstate + 1]);
        } else {
          // The current state has not appeared in the stm before. Push it and
          // its first continuation observed here to the stm.
          var newObj = {};
          newObj[stateType] = state_context_pairs[_iscr][jstate][stateType];
          newObj.continuations = [state_context_pairs[_iscr][jstate + 1]];
          stm.push(newObj);
        }
      }
      // console.log('Completed processing composition ' + iscr);
    }
    return stm;
  },

  prune_stm: function prune_stm(stm, param) {
    var self = this;
    var stateType = param.stateType;
    var nosConsecutives = param.nosConsecutives;

    // Identify dead-ends.
    stm.map(function (stateConts, idx) {
      if (idx % 500 == 0) {
        console.log("Pruning at index " + idx + " of " + stm.length + ".");
      }
      stateConts.deadEnd = self.prune_helper(stateConts, stm, stateType, nosConsecutives);
    });
    // console.log("Dead-ends identified, stm.length:", stm.length)
    // Remove them and associated continuations.
    for (var i = stm.length - 1; i >= 0; i--) {
      if (i % 500 == 0) {
        console.log("Checking removal need at index " + i + " of " + stm.length + ".");
      }
      if (stm[i].deadEnd) {
        stm = self.prune_remover(stm[i][stateType], stm, stateType);
      }
    }
    // console.log("Dead-ends and associated continuations removed, stm.length:", stm.length)
    // Remove any states whose continuations array is now of length zero.
    for (var _i = stm.length - 1; _i >= 0; _i--) {
      if (_i % 500 == 0) {
        console.log("Checking continuations length at " + _i + " of " + stm.length + ".");
      }
      if (stm[_i].continuations.length == 0) {
        stm.splice(_i, 1);
      }
    }
    // Delete deadEnd properties, since we're done with them now.
    stm = stm.map(function (stateConts) {
      delete stateConts.deadEnd;
      return stateConts;
    });
    return stm;
  },

  prune_helper: function prune_helper(stateConts, stm, stateType, nosConsecutives) {
    var pruneAns = []; // Defining as an array to enforce pass by reference.
    this.prune_helper_2(stateConts, stm, stateType, nosConsecutives, pruneAns);
    // if (pruneAns.length > 1){
    //   console.log("NOT SURE THIS SHOULD GROW TO LENGTH 2+!")
    // }
    return pruneAns[0];
  },

  prune_helper_2: function prune_helper_2(stateConts, stm, stateType, nosConsecutives, pruneAns) {
    var consecCount = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

    var self = this;
    // console.log("consecCount:", consecCount)
    if (consecCount == nosConsecutives) {
      // We reached the limit of how far we can go from the original state without
      // encountering at least one other different piece_id, so the original state
      // is considered a dead end for this value of nosConsecutives.
      pruneAns.push(true);
      return;
    }
    var unqIds = mu.get_unique(stateConts["continuations"].map(function (c) {
      return c.context.piece_id;
    }));
    // console.log("unqIds:", unqIds)
    if (unqIds.length > 1) {
      // At least one other different piece_id, so we're good.
      pruneAns.push(false);
      return;
    }
    stateConts["continuations"].forEach(function (c) {
      // Keep looking for each continuation of this state.
      // console.log("c[stateType]:", c[stateType])
      var relIdx = mu.array_object_index_of_array(stm, c[stateType], stateType);
      // console.log("relIdx:", relIdx)
      if (relIdx >= 0) {
        self.prune_helper_2(stm[relIdx], stm, stateType, nosConsecutives, pruneAns, consecCount + 1);
      }
      // If we get here, then a terminal state must have been encountered.
      // console.log("Terminal state encountered!")
    });
  },

  prune_remover: function prune_remover(state, stm, stateType) {
    // Remove all occurrences of the dead-end state from continuations.
    var relIdx = mu.array_object_index_of_array(stm, state, stateType);
    stm = stm.map(function (sc) {
      sc.continuations = sc.continuations.filter(function (c) {
        return !c[stateType].equals(state);
      });
      return sc;
    });
    // Remove the state itself from the stm.
    stm.splice(relIdx, 1);
    return stm;
  },

  note_point_set2comp_obj: function note_point_set2comp_obj(ps) {
    var timeSigs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [{ "barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0 }];
    var isPerc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var f = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : mu.farey(4);
    var onIdx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var mnnIdx = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var durIdx = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 3;
    var chanIdx = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 4;
    var velIdx = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 5;

    var comp = {};
    var notes = [];
    var maxInd;
    // Split up MIDI notes by channel number.
    var unqChan = [];
    var psByChan = [];
    ps.map(function (n) {
      if (unqChan.indexOf(n[chanIdx]) === -1) {
        unqChan.push(n[chanIdx]);
        psByChan[n[chanIdx]] = [n];
      } else {
        psByChan[n[chanIdx]].push(n);
      }
      return;
    });
    // console.log("unqChan:", unqChan);
    // console.log("psByChan:", psByChan);
    var numTracks = 0;
    comp["layer"] = [];
    unqChan.map(function (track, ind) {
      numTracks++;
      comp.layer.push({ staffNo: track });
      return;
    });
    // console.log("comp.layer:", comp.layer);
    // console.log("numTracks:", numTracks);
    if (numTracks === 0) {
      console.log("No tracks found in this MIDI file.");
      return;
    }

    comp["layer"] = comp["layer"].map(function (track, layerNum) {
      var layer = {};
      if (track == 10) {
        layer["idInstrument"] = "edm_drum_kit";
      } else {
        layer["idInstrument"] = "acoustic_grand_piano";
      }
      // layer["idInstrument"] = assign_instrument_basic(track)
      // This won"t work because we"re no longer importing from MIDI.
      // console.log("track.instrumentNumber:", track.instrumentNumber);
      // layer["idInstrument"] = an.assign_instrument_basic(track.instrumentNumber)
      layer["staffNo"] = layerNum;
      layer["timestampLastUsed"] = "";
      layer["vexflow"] = { "name": "", "abbreviation": "", "staffOrderNo": layerNum
        // This won't work because we're no longer importing from MIDI.
        // layer["vexflow"] = { "name": track.name || "", "abbreviation": "", "staffOrderNo": layerNum }
      };if (psByChan[track.staffNo] !== undefined) {
        // Get the track.notes and quantise them.
        var ps2 = psByChan[track.staffNo].filter(function (note) {
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
        .filter(function (p) {
          // Gets rid of really low/high notes.
          return p[mnnIdx] >= 21 && p[mnnIdx] <= 108;
        });
        // console.log("unquantised ps2.slice(0, 3):", ps2.slice(0, 3))
        if (f !== null) {
          ps2 = mu.farey_quantise(ps2, f, [onIdx, durIdx]);
          ps2 = mu.unique_rows(ps2, true)[0];
        }
        // console.log("quantised ps2.slice(0, 3):", ps2.slice(0, 3))
        notes.push.apply(notes, _toConsumableArray(ps2.map(function (p) {
          var compNote = mu.timelapse_object();
          // var compNote = {}
          // compNote["id"] = uu()
          // but it has implications in terms of file size.
          compNote["ontime"] = p[onIdx];
          if (p[durIdx] > 8) {
            compNote["duration"] = 8;
            // console.log("Long duration corrected.")
          } else {
            compNote["duration"] = p[durIdx];
          }
          compNote["offtime"] = compNote.ontime + compNote.duration;
          var barBeat = mu.bar_and_beat_number_of_ontime(compNote.ontime, timeSigs);
          compNote["barOn"] = barBeat[0];
          compNote["beatOn"] = barBeat[1];
          barBeat = mu.bar_and_beat_number_of_ontime(compNote.offtime, timeSigs);
          compNote["barOff"] = barBeat[0];
          compNote["beatOff"] = barBeat[1];
          // compNote["pitch"] = note.name
          compNote["MNN"] = p[mnnIdx];
          // compNote["MPN"] = 0
          compNote["staffNo"] = p[chanIdx];
          compNote["tonejs"] = {
            "volume": p[velIdx] // Math.round(100*p[velIdx]/127)/100
          };
          compNote["voiceNo"] = 0;
          // compNote["isPerc"] = true
          return compNote;
        })));
        // console.log("notes.slice(0, 10):", notes.slice(0, 10));
      }
      return layer;
    });
    // console.log("notes.length:", notes.length);

    var keySig;
    if (!isPerc) {
      keySig = mu.fifth_steps_mode(ps, mu.krumhansl_and_kessler_key_profiles);
    } else {
      keySig = ["C major", 1, 0, 0];
    }
    comp["keySignatures"] = [{
      "barNo": 1,
      "keyName": keySig[0],
      "fifthSteps": keySig[2],
      "mode": keySig[3],
      "ontime": 0
    }];
    // console.log("keySig:", keySig);
    comp["timeSignatures"] = timeSigs;
    // Guess note names.
    notes.forEach(function (note) {
      note["MPN"] = mu.guess_morphetic(note.MNN, keySig[2], keySig[3]);
      note["pitch"] = mu.midi_note_morphetic_pair2pitch_and_octave(note.MNN, note.MPN);
    });
    comp["notes"] = notes.sort(mu.sort_points_asc);
    // comp["sequencing"] = [{"ontime": 0, "offtime": 16, "repetitionNo": 1}]
    comp["tempi"] = [{ "barNo": 1, "ontime": 0, "bpm": 120, "tempo": "" }];
    // comp["tempi"] = [{"barNo": 1, "ontime": 0, "bpm": midi.header.bpm, "tempo": ""}]
    return comp;
  },

  centre_point_set: function centre_point_set(fifth_steps_mode, point_set) {
    var idxMNN = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var idxMPN = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2;

    // Tom Collins 26/1/2015.
    // Translates the point set so that the tonic pitch class closest to the mean
    // MIDI note number is represented by the pair [0, 0].

    var MNN_MPN_pair = this.fifth_steps_mode2MNN_MPN(fifth_steps_mode);
    // console.log("MNN_MPN_pair:", MNN_MPN_pair)

    // Find the MIDI note number of the tonic pitch class closest to the mean
    // MIDI note number of the piece. Start by finding the mean MNN.
    var MNNs = [];
    for (i = 0; i < point_set.length; i++) {
      MNNs.push(point_set[i][1]);
    }
    var MNN_mu = mu.mean(MNNs);
    // console.log('Mean MNN:');
    // console.log(MNN_mu);

    // Get the MNNs for all the tonic pitch classes.
    var MNN_tonal = [];
    for (var i = MNN_MPN_pair[0] - 60; i <= MNN_MPN_pair[0] + 72; i = i + 12) {
      MNN_tonal[MNN_tonal.length] = i;
    }

    // Now find the MNN of the tonic pitch class closest to the mean MNN.
    var dist = [];
    var n_tonal = MNN_tonal.length;
    for (i = 0; i < n_tonal; i++) {
      dist[i] = Math.abs(MNN_tonal[i] - MNN_mu);
    }
    var min_stuff = mu.min_argmin(dist);
    var trans_pair = [MNN_MPN_pair[0] + 12 * (min_stuff[1] - 5), MNN_MPN_pair[1] + 7 * (min_stuff[1] - 5)];

    for (i = 0; i < point_set.length; i++) {
      var new_MNN = point_set[i][idxMNN] - trans_pair[0];
      var new_MPN = point_set[i][idxMPN] - trans_pair[1];
      point_set[i].splice(idxMNN, 1, new_MNN);
      point_set[i].splice(idxMPN, 1, new_MPN);
    }
    return [trans_pair, point_set];
  },

  construct_prune_write_initial: function construct_prune_write_initial(_comps, _stm, _param) {
    var initialDistbn = this.construct_initial(_comps, _param);
    initialDistbn = this.prune_initial(initialDistbn, _stm, _param);
    if (initialDistbn.length > 0) {
      fs.writeFileSync(path.join(_param.outPath, _param.filename + "_initial.js"), JSON.stringify(initialDistbn) //, null, 2)
      );
      if (_param.initialTimer) {
        clearTimeout(_param.initialTimer);
      }
      return initialDistbn;
    }
    // Else, return undefined.
  },

  construct_initial: function construct_initial(compObjs, param) {
    var stateType = param.stateType;
    var onAndOff = param.onAndOff;
    var squashRange = param.squashRangeMidi;
    var phraseBoundaryPropName = param.phraseBoundaryPropName;

    // Could check that each of the compObjs have just one time signature, and
    // that they are all equal to one another...

    var nscr = compObjs.length;
    var state_context_pairs = [];
    for (var iscr = 0; iscr < nscr; iscr++) {
      switch (stateType) {
        case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(compObjs[iscr], onAndOff, squashRange);
          break;
        case "lyrics_state":
          state_context_pairs[iscr] = this.lyrics_obj2lyrics_states(compObjs[iscr]);
          break;
        default:
          console.log("SHOULD NOT GET HERE!");
      }
      //if (iscr == 0){
      //  console.log('state_context_pairs[iscr]:', state_context_pairs[iscr]);
      //}
    }

    var initial = [];
    if (stateType == "lyrics_state") {
      for (var _iscr2 = 0; _iscr2 < nscr; _iscr2++) {
        for (var jstate = 0; jstate < state_context_pairs[_iscr2].length - 1; jstate++) {
          // console.log('Curr state:');
          // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
          var scPair = state_context_pairs[_iscr2][jstate];
          if (scPair.context.index_in_line == 0) {
            initial.push(scPair);
          }
        }
      }
    } else {
      for (var _iscr3 = 0; _iscr3 < nscr; _iscr3++) {
        var _loop = function _loop(_jstate) {
          // console.log('Curr state:');
          // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
          var scPair = state_context_pairs[_iscr3][_jstate];
          if (phraseBoundaryPropName) {
            // Is there a phrase boundary ontime sufficiently close to the
            // ontime of this segment?
            if (compObjs[_iscr3][phraseBoundaryPropName].find(function (o) {
              return Math.abs(o - scPair["context"]["orig_ontime"]) < .00002;
            })) {
              // Yes
              initial.push(scPair);
            }
          } else {
            if (scPair[stateType][0] == 1) {
              initial.push(scPair);
            }
          }
        };

        for (var _jstate = 0; _jstate < state_context_pairs[_iscr3].length - 1; _jstate++) {
          _loop(_jstate);
        }
      }
    }
    return initial;
  },

  construct_scl: function construct_scl(compObjs, param) {
    var stateType = param.stateType;
    var onAndOff = param.onAndOff;
    var squashRange = param.squashRangeMidi;
    var phraseBoundaryPropName = param.phraseBoundaryPropName;

    // Could check that each of the compObjs have just one time signature, and
    // that they are all equal to one another...

    var nscr = compObjs.length;
    var state_context_pairs = [];
    for (var iscr = 0; iscr < nscr; iscr++) {
      switch (stateType) {
        case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(compObjs[iscr], onAndOff);
          break;
        case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(compObjs[iscr], onAndOff, squashRange);
          break;
        case "lyrics_state":
          state_context_pairs[iscr] = this.lyrics_obj2lyrics_states(compObjs[iscr]);
          break;
        default:
          console.log("SHOULD NOT GET HERE!");
      }
      //if (iscr == 0){
      //  console.log('state_context_pairs[iscr]:', state_context_pairs[iscr]);
      //}
    }

    var scl = {};
    for (var _iscr4 = 0; _iscr4 < nscr; _iscr4++) {
      for (var jstate = 0; jstate < state_context_pairs[_iscr4].length - 1; jstate++) {
        var scPair = state_context_pairs[_iscr4][jstate];
        var key = void 0;
        if (stateType == "lyrics_state") {
          // State is already a string.
          key = scPair[stateType];
        } else {
          // State is not a string, but we can make it so.
          key = this.state2string(scPair[stateType]);
        }

        if (scl[key] !== undefined) {
          scl[key].push(scPair["context"]);
        } else {
          scl[key] = [scPair["context"]];
        }
      }
    }
    return scl;
  },

  prune_initial: function prune_initial(initialDistbn, stm, param) {
    var stateType = param.stateType;

    return initialDistbn.filter(function (scPair) {
      return mu.array_object_index_of_array(stm, scPair[stateType], stateType) >= 0;
    });
  },

  fifth_steps_mode2MNN_MPN: function fifth_steps_mode2MNN_MPN(fifth_steps_mode) {
    // Tom Collins 26/1/2015.
    // A pair consisting of position on the circle of fifths and mode (0 for
    // Ionian, 1 for Dorian, etc.) is converted to a pair consisting of a MIDI
    // note number and morphetic pitch number for the tonic.

    var conversion = [// Major keys (Ionian modes).
    [[0, 0], [60, 60]], [[1, 0], [67, 64]], [[2, 0], [62, 61]], [[3, 0], [69, 65]], [[4, 0], [64, 62]], [[5, 0], [71, 66]], [[6, 0], [66, 63]], [[7, 0], [61, 60]], [[8, 0], [68, 64]], [[9, 0], [63, 61]], [[10, 0], [70, 65]], [[-1, 0], [65, 63]], [[-2, 0], [70, 66]], [[-3, 0], [63, 62]], [[-4, 0], [68, 65]], [[-5, 0], [61, 61]], [[-6, 0], [66, 64]], [[-7, 0], [71, 67]], [[-8, 0], [64, 63]],
    // Minor keys (Aeolian modes).
    [[0, 5], [63, 62]], [[1, 5], [70, 66]], [[2, 5], [65, 63]], [[3, 5], [60, 60]], [[4, 5], [67, 64]], [[5, 5], [62, 61]], [[6, 5], [69, 65]], [[7, 5], [64, 62]], [[8, 5], [71, 66]], [[9, 5], [66, 63]], [[-1, 5], [68, 65]], [[-2, 5], [61, 61]], [[-3, 5], [66, 64]], [[-4, 5], [71, 66]], [[-5, 5], [64, 62]], [[-6, 5], [69, 65]]];
    var i = 0;
    while (i < conversion.length) {
      if (conversion[i][0][0] == fifth_steps_mode[0] && conversion[i][0][1] == fifth_steps_mode[1]) {
        var MNN_MPN_pair = conversion[i][1];
        i = conversion.length;
      } else {
        i++;
      }
    }
    return MNN_MPN_pair;
  },

  string2lyrics: function string2lyrics(str) {
    // Retain characters that are alphanumeric, a space, or a line break.
    var lines = str.split("\n")
    // Get rid of multiple line breaks.
    .filter(function (line) {
      return line.length > 0;
    }).map(function (line) {
      var words = line.replace(/[^a-z0-9\ ]/gi, "").toLowerCase();
      return words.split("\ ");
    });
    // console.log("lines:", lines)
    return lines;
  },

  state2string: function state2string(state) {
    // Tom Collins 26/5/2020.
    // Assumption here is that the state will be of the form
    // [1, [ -7, -3, 0, 12 ]]
    // and the output will be of the form
    // "1|-7,-3,0,12"

    return state[0] + "|" + state[1];
    // state[1].map(function(m, idx){
    //   if (idx == state[1].length - 1){
    //     return m
    //   }
    //   return m + ","
    // })
  },

  string2state: function string2state(str) {
    // Tom Collins 26/5/2020.
    // Assumption here is that the string will be of the form
    // "1|-7,-3,0,12"
    // and the output will be of the form
    // [1, [ -7, -3, 0, 12 ]]

    var split = str.split("|");
    var arrStr = split[1].split(",");
    return [parseFloat(split[0]), arrStr.map(function (num) {
      return parseInt(num);
    })];
  }

};