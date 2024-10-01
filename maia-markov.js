var mm = (function () {
  'use strict';

  // Imports
  // import 'maia-util'
  // import mu from 'maia-util'
  const fs$4 = require('fs');
  const mu$5 = require('maia-util');
  // const uu = require('uuid')

  // Constructor for Analyzer object
  function Analyzer$1(){
    // Workaround for JS context peculiarities.
    // var self = this;
    // Possible to return something.
    // return sth;
  }
  // Methods for Analyzer object
  Analyzer$1.prototype = {
    constructor: Analyzer$1,

    comp_obj2beat_mnn_states: function(
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
        var D = mu$5.comp_obj2note_point_set(compObj);
        var segE = mu$5.segment(D, onAndOff, idxOn, idxDur);

        // Iterate over segE, converting the ontime of each segment to a beat
        // number and extracting the MIDI note numbers.
        for (let i = 0; i < segE.length; i++){
          var bar_beat = mu$5.bar_and_beat_number_of_ontime(
            segE[i].ontime, compObj.timeSignatures
          );
          // This is beat of the bar in crotchet beats rounded to 5 decimal places.
          var beat_round = Math.round(bar_beat[1]*100000)/100000;
          var MNN = new Array(segE[i].points.length);
          for (let j = 0; j < segE[i].points.length; j++){
            MNN[j] = segE[i].points[j][idxMNN];
          }
          // Sort the MNN_rel entries and retain only the unique members.
          var unqAndIdx = mu$5.unique_rows(MNN.map(function(m){ return [m] }));
          var unqMNN = unqAndIdx[0].map(function(arr){ return arr[0] });
          // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
          var mapSwitch = new Array(MNN.length);
          unqAndIdx[1].map(function(arr, idx){
            arr.map(function(el){
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
          if (segE[i].offtime - segE[i].ontime >= .00002 && unqMNN.length > 0){
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

    comp_obj2beat_rel_mnn_states: function(
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
      else {
        var D = mu$5.comp_obj2note_point_set(compObj);
        var segD = mu$5.segment(D, onAndOff, idxOn, idxDur);

        // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
        var fifth_steps = compObj.keySignatures[0].fifthSteps;
        var mode = compObj.keySignatures[0].mode;
        var trans_pair_and_c_point_set = this.centre_point_set(
          [fifth_steps, mode], mu$5.copy_point_set(D)
        );
        var trans_pair = trans_pair_and_c_point_set[0];
        // console.log('trans_pair:');
        // console.log(trans_pair);
        var E = trans_pair_and_c_point_set[1];
        var segE = mu$5.segment(E, onAndOff, idxOn, idxDur);
        // console.log('segments:');
        // console.log(segE);

        // Iterate over segE, converting the ontime of each segment to a beat
        // number and extracting the relative MIDI note numbers.
        for (let i = 0; i < segE.length; i++){
          var bar_beat = mu$5.bar_and_beat_number_of_ontime(
            segE[i].ontime, compObj.timeSignatures
          );
          // This is beat of the bar in crotchet beats rounded to 5 decimal places.
          var beat_round = Math.round(bar_beat[1]*100000)/100000;
          var rel_MNN = new Array(segE[i].points.length);
          for (let j = 0; j < segE[i].points.length; j++){
            rel_MNN[j] = segE[i].points[j][idxMNN];
          }
          // Sort the rel_MNN entries and retain only the unique members.
          var unqAndIdx = mu$5.unique_rows(rel_MNN.map(function(m){ return [m] }));
          var unqRelMNN = unqAndIdx[0].map(function(arr){ return arr[0] });
          // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
          var mapSwitch = new Array(rel_MNN.length);
          unqAndIdx[1].map(function(arr, idx){
            arr.map(function(el){
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
          if (segE[i].offtime - segE[i].ontime >= .00002 && unqRelMNN.length > 0){
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

    comp_obj2beat_rel_sq_mnn_states: function(
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
      else {
        var D = mu$5.comp_obj2note_point_set(compObj);
        var segD = mu$5.segment(D, onAndOff, idxOn, idxDur);

        // console.log("compObj.keySignatures[0]:", compObj.keySignatures[0])
        var fifth_steps = compObj.keySignatures[0].fifthSteps;
        var mode = compObj.keySignatures[0].mode;
        var trans_pair_and_c_point_set = this.centre_point_set(
          [fifth_steps, mode], mu$5.copy_point_set(D)
        );
        var trans_pair = trans_pair_and_c_point_set[0];
        // console.log('trans_pair:');
        // console.log(trans_pair);
        var E = trans_pair_and_c_point_set[1];
        var segE = mu$5.segment(E, onAndOff, idxOn, idxDur);
        // console.log('segments:');
        // console.log(segE);

        // Iterate over segE, converting the ontime of each segment to a beat
        // number and extracting the relative MIDI note numbers.
        for (let i = 0; i < segE.length; i++){
          var bar_beat = mu$5.bar_and_beat_number_of_ontime(
            segE[i].ontime, compObj.timeSignatures
          );
          // This is beat of the bar in crotchet beats rounded to 5 decimal places.
          var beat_round = Math.round(bar_beat[1]*100000)/100000;
          var rel_sq_MNN = new Array(segE[i].points.length);
          for (let j = 0; j < segE[i].points.length; j++){
            // console.log("j:", j)
            //*************
            // Squashing! *
            //*************
            let m = segE[i].points[j][idxMNN];
            // console.log("m:", m)
            while (m > squashRange || m < -squashRange){
              if (m > squashRange){
                m -= squashRange;
              }
              else {
                m += squashRange;
              }
            }
            rel_sq_MNN[j] = m;
          }
          // Sort the rel_sq_MNN entries and retain only the unique members.
          var unqAndIdx = mu$5.unique_rows(rel_sq_MNN.map(function(m){ return [m] }));
          var unq_rel_sq_MNN = unqAndIdx[0].map(function(arr){ return arr[0] });
          // Want to switch the mapping from this [[0, 2], [1], [3]] to [0, 1, 0, 2]
          var mapSwitch = new Array(rel_sq_MNN.length);
          unqAndIdx[1].map(function(arr, idx){
            arr.map(function(el){
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
          if (segE[i].offtime - segE[i].ontime >= .00002 && rel_sq_MNN.length > 0){
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

    lyrics_obj2lyrics_states: function(lyricsObj){
      // Tom Collins 11/1/2015.
      // This function converts a lyricsObj variable to an array consisting of
      // json variables. Each json variable contains state and context information
      // for a segment of the input lyricsObj variable. This can then be analysed
      // (by another function) for possible continuations between states in one or
      // more pieces.

      var out_array = [];
      lyricsObj.lyricsArr.forEach(function(line, idx){
        line.forEach(function(word, jdx){
          let state = [];
          state.push(word);
          if (jdx < line.length - 1){
            state.push(line[jdx + 1]);
          }
          else {
            if (idx < lyricsObj.lyricsArr.length - 1){
              state.push(lyricsObj.lyricsArr[idx + 1][0]);
            }
          }
          if (state.length == 2){
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
      return out_array
    },

    construct_prune_write_stm: function(_comps, _param){
      let anStm = this.construct_stm(_comps, _param);
      console.log("anStm.length:", anStm.length);
      anStm = this.prune_stm(anStm, _param);
      console.log("pruned anStm.length:", anStm.length);
      // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
      // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
      fs$4.writeFileSync(
        path.join(_param.outPath, _param.filename + "_stm.js"),
        JSON.stringify(anStm)//, null, 2)
      );
      if (_param.stmTimer){
        clearTimeout(_param.stmTimer);
      }
      return anStm
    },

    construct_stm: function(compObjs, param){
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

      const stateType = param.stateType;
      const onAndOff = param.onAndOff;
      const squashRange = param.squashRangeMidi;

      // Could check that each of the compObjs have just one time signature, and
      // that they are all equal to one another...

      var nscr = compObjs.length;
      var state_context_pairs = [];
      for (let iscr = 0; iscr < nscr; iscr++){
        switch (stateType){
          case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(
            compObjs[iscr],
            onAndOff,
            squashRange
          );
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
      for (let iscr = 0; iscr < nscr; iscr++){
        for (let jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
          // console.log('Curr state:');
          // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
          var rel_idx = mu$5.array_object_index_of_array(
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
            var newObj = {};
            newObj[stateType] = state_context_pairs[iscr][jstate][stateType];
            newObj.continuations = [state_context_pairs[iscr][jstate + 1]];
            stm.push(newObj);
          }
        }
        // console.log('Completed processing composition ' + iscr);
      }
      return stm;
    },

    prune_stm: function(stm, param){
      const self = this;
      const stateType = param.stateType;
      const nosConsecutives = param.nosConsecutives;

      // Identify dead-ends.
      stm.map(function(stateConts, idx){
        if (idx % 500 == 0){
          console.log("Pruning at index " + idx + " of " + stm.length + ".");
        }
        stateConts.deadEnd = self.prune_helper(stateConts, stm, stateType, nosConsecutives);
      });
      // console.log("Dead-ends identified, stm.length:", stm.length)
      // Remove them and associated continuations.
      for (let i = stm.length - 1; i >= 0; i--){
        if (i % 500 == 0){
          console.log("Checking removal need at index " + i + " of " + stm.length + ".");
        }
        if (stm[i].deadEnd){
          stm = self.prune_remover(stm[i][stateType], stm, stateType);
        }
      }
      // console.log("Dead-ends and associated continuations removed, stm.length:", stm.length)
      // Remove any states whose continuations array is now of length zero.
      for (let i = stm.length - 1; i >= 0; i--){
        if (i % 500 == 0){
          console.log("Checking continuations length at " + i + " of " + stm.length + ".");
        }
        if (stm[i].continuations.length == 0){
          stm.splice(i, 1);
        }
      }
      // Delete deadEnd properties, since we're done with them now.
      stm = stm.map(function(stateConts){
        delete stateConts.deadEnd;
        return stateConts
      });
      return stm
    },

    prune_helper: function(stateConts, stm, stateType, nosConsecutives){
      let pruneAns = []; // Defining as an array to enforce pass by reference.
      this.prune_helper_2(stateConts, stm, stateType, nosConsecutives, pruneAns);
      // if (pruneAns.length > 1){
      //   console.log("NOT SURE THIS SHOULD GROW TO LENGTH 2+!")
      // }
      return pruneAns[0]
    },

    prune_helper_2: function(stateConts, stm, stateType, nosConsecutives, pruneAns, consecCount = 0){
      const self = this;
      // console.log("consecCount:", consecCount)
      if (consecCount == nosConsecutives){
        // We reached the limit of how far we can go from the original state without
        // encountering at least one other different piece_id, so the original state
        // is considered a dead end for this value of nosConsecutives.
        pruneAns.push(true);
        return
      }
      const unqIds = mu$5.get_unique(
        stateConts["continuations"].map(function(c){ return c.context.piece_id })
      );
      // console.log("unqIds:", unqIds)
      if (unqIds.length > 1){
        // At least one other different piece_id, so we're good.
        pruneAns.push(false);
        return
      }
      stateConts["continuations"].forEach(function(c){
        // Keep looking for each continuation of this state.
        // console.log("c[stateType]:", c[stateType])
        const relIdx = mu$5.array_object_index_of_array(stm, c[stateType], stateType);
        // console.log("relIdx:", relIdx)
        if (relIdx >= 0){
          self.prune_helper_2(stm[relIdx], stm, stateType, nosConsecutives, pruneAns, consecCount + 1);
        }
        // If we get here, then a terminal state must have been encountered.
        // console.log("Terminal state encountered!")
      });
    },

    prune_remover: function(state, stm, stateType){
      // Remove all occurrences of the dead-end state from continuations.
      const relIdx = mu$5.array_object_index_of_array(stm, state, stateType);
      stm = stm.map(function(sc){
        sc.continuations = sc.continuations.filter(function(c){
          return !c[stateType].equals(state)
        });
        return sc
      });
      // Remove the state itself from the stm.
      stm.splice(relIdx, 1);
      return stm
    },

    note_point_set2comp_obj: function(
      ps, timeSigs = [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}],
      isPerc = false, f = mu$5.farey(4),
      onIdx = 0, mnnIdx = 1, durIdx = 3, chanIdx = 4, velIdx = 5
    ){
      var comp = {};
      var notes = [];
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
          layer["idInstrument"] = "edm_drum_kit";
        }
        else {
          layer["idInstrument"] = "acoustic_grand_piano";
        }
        // layer["idInstrument"] = assign_instrument_basic(track)
        // This won"t work because we"re no longer importing from MIDI.
        // console.log("track.instrumentNumber:", track.instrumentNumber);
        // layer["idInstrument"] = an.assign_instrument_basic(track.instrumentNumber)
        layer["staffNo"] = layerNum;
        layer["timestampLastUsed"] = "";
        layer["vexflow"] = { "name": "", "abbreviation": "", "staffOrderNo": layerNum };
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
          if (f !== null){
            ps2 = mu$5.farey_quantise(ps2, f, [onIdx, durIdx]);
            ps2 = mu$5.unique_rows(ps2, true)[0];
          }
          // console.log("quantised ps2.slice(0, 3):", ps2.slice(0, 3))
          notes.push(...ps2.map(function(p){
            var compNote = mu$5.timelapse_object();
            // var compNote = {}
            // compNote["id"] = uu()
            // but it has implications in terms of file size.
            compNote["ontime"] = p[onIdx];
            if (p[durIdx] > 8){
              compNote["duration"] = 8;
              // console.log("Long duration corrected.")
            }
            else {
              compNote["duration"] = p[durIdx];
            }
            compNote["offtime"] = compNote.ontime + compNote.duration;
            var barBeat = mu$5.bar_and_beat_number_of_ontime(compNote.ontime, timeSigs);
            compNote["barOn"] = barBeat[0];
            compNote["beatOn"] = barBeat[1];
            barBeat = mu$5.bar_and_beat_number_of_ontime(compNote.offtime, timeSigs);
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
            return compNote
          }));
          // console.log("notes.slice(0, 10):", notes.slice(0, 10));
        }
        return layer
      });
      // console.log("notes.length:", notes.length);

      var keySig;
      if (!isPerc){
        keySig = mu$5.fifth_steps_mode(ps, mu$5.krumhansl_and_kessler_key_profiles);
      }
      else {
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
        note["MPN"] = mu$5.guess_morphetic(note.MNN, keySig[2], keySig[3]);
        note["pitch"] = mu$5.midi_note_morphetic_pair2pitch_and_octave(note.MNN, note.MPN);
      });
      comp["notes"] = notes.sort(mu$5.sort_points_asc);
      // comp["sequencing"] = [{"ontime": 0, "offtime": 16, "repetitionNo": 1}]
      comp["tempi"] = [{"barNo": 1, "ontime": 0, "bpm": 120, "tempo": ""}];
      // comp["tempi"] = [{"barNo": 1, "ontime": 0, "bpm": midi.header.bpm, "tempo": ""}]
      return comp;
    },

    centre_point_set:function (
      fifth_steps_mode, point_set, idxMNN = 1, idxMPN = 2
    ){
      // Tom Collins 26/1/2015.
      // Translates the point set so that the tonic pitch class closest to the mean
      // MIDI note number is represented by the pair [0, 0].

      var MNN_MPN_pair = this.fifth_steps_mode2MNN_MPN(fifth_steps_mode);
      // console.log("MNN_MPN_pair:", MNN_MPN_pair)

      // Find the MIDI note number of the tonic pitch class closest to the mean
      // MIDI note number of the piece. Start by finding the mean MNN.
      var MNNs = [];
      for (i = 0; i < point_set.length; i++){
        MNNs.push(point_set[i][1]);
      }
      var MNN_mu = mu$5.mean(MNNs);
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
      var min_stuff = mu$5.min_argmin(dist);
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
    },

    construct_prune_write_initial: function(_comps, _stm, _param){
      let initialDistbn = this.construct_initial(_comps, _param);
      initialDistbn = this.prune_initial(initialDistbn, _stm, _param);
      fs$4.writeFileSync(
        path.join(_param.outPath, _param.filename + "_initial.js"),
        JSON.stringify(initialDistbn)//, null, 2)
      );
      if (_param.initialTimer){
        clearTimeout(_param.initialTimer);
      }
    },

    construct_initial: function(compObjs, param){
      const stateType = param.stateType;
      const onAndOff = param.onAndOff;
      const squashRange = param.squashRangeMidi;
      const phraseBoundaryPropName = param.phraseBoundaryPropName;

      // Could check that each of the compObjs have just one time signature, and
      // that they are all equal to one another...

      var nscr = compObjs.length;
      var state_context_pairs = [];
      for (let iscr = 0; iscr < nscr; iscr++){
        switch (stateType){
          case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(
            compObjs[iscr],
            onAndOff,
            squashRange
          );
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
      if (stateType == "lyrics_state"){
        for (let iscr = 0; iscr < nscr; iscr++){
          for (let jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
            // console.log('Curr state:');
            // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
            let scPair = state_context_pairs[iscr][jstate];
            if (scPair.context.index_in_line == 0){
              initial.push(scPair);
            }
          }
        }
      }
      else {
        for (let iscr = 0; iscr < nscr; iscr++){
          for (let jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
            // console.log('Curr state:');
            // console.log(state_context_pairs[iscr][jstate]["beat_MNN_state"]);
            let scPair = state_context_pairs[iscr][jstate];
            if (phraseBoundaryPropName){
              // Is there a phrase boundary ontime sufficiently close to the
              // ontime of this segment?
              if (
                compObjs[iscr][phraseBoundaryPropName].find(function(o){
                  return Math.abs(o - scPair["context"]["orig_ontime"]) < .00002
                })
              ){
                // Yes
                initial.push(scPair);
              }
            }
            else {
              if (scPair[stateType][0] == 1){
                initial.push(scPair);
              }
            }
          }
        }
      }
      return initial;
    },

    construct_scl: function(compObjs, param){
      const stateType = param.stateType;
      const onAndOff = param.onAndOff;
      const squashRange = param.squashRangeMidi;
      param.phraseBoundaryPropName;

      // Could check that each of the compObjs have just one time signature, and
      // that they are all equal to one another...

      const nscr = compObjs.length;
      const state_context_pairs = [];
      for (let iscr = 0; iscr < nscr; iscr++){
        switch (stateType){
          case "beat_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_mnn_states(
            compObjs[iscr],
            onAndOff
          );
          break;
          case "beat_rel_sq_MNN_state":
          state_context_pairs[iscr] = this.comp_obj2beat_rel_sq_mnn_states(
            compObjs[iscr],
            onAndOff,
            squashRange
          );
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

      const scl = {};
      for (let iscr = 0; iscr < nscr; iscr++){
        for (let jstate = 0; jstate < state_context_pairs[iscr].length - 1; jstate++){
          const scPair = state_context_pairs[iscr][jstate];
          let key;
          if (stateType == "lyrics_state"){
            // State is already a string.
            key = scPair[stateType];
          }
          else {
            // State is not a string, but we can make it so.
            key = this.state2string(scPair[stateType]);
          }

          if (scl[key] !== undefined){
            scl[key].push(scPair["context"]);
          }
          else {
            scl[key] = [scPair["context"]];
          }
        }
      }
      return scl
    },

    prune_initial: function(initialDistbn, stm, param){
      const stateType = param.stateType;

      return initialDistbn.filter(function(scPair){
        return mu$5.array_object_index_of_array(
          stm, scPair[stateType], stateType
        ) >= 0
      })
    },

    fifth_steps_mode2MNN_MPN: function(fifth_steps_mode){
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
        else {
          i++;
        }
      }
      return MNN_MPN_pair;
    },

    string2lyrics: function(str){
      // Retain characters that are alphanumeric, a space, or a line break.
      let lines = str.split("\n")
      // Get rid of multiple line breaks.
      .filter(function(line){
        return line.length > 0
      })
      .map(function(line){
        let words = line.replace(/[^a-z0-9\ ]/gi, "").toLowerCase();
        return words.split("\ ")
      });
      // console.log("lines:", lines)
      return lines
    },

    state2string: function(state){
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
    },

    string2state: function(str){
      // Tom Collins 26/5/2020.
      // Assumption here is that the string will be of the form
      // "1|-7,-3,0,12"
      // and the output will be of the form
      // [1, [ -7, -3, 0, 12 ]]

      let split = str.split("|");
      let arrStr = split[1].split(",");
      return [
        parseFloat(split[0]),
        arrStr.map(function(num){
          return parseInt(num)
        })
      ]
    }

  };

  // Imports
  const mu$4 = require('maia-util');
  // import 'maia-util'
  // import mu from 'maia-util'

  // Constructor for Generator object
  function Generator$1(){
    // Workaround for JS context peculiarities.
    // var self = this;
    // Possible to return something.
    // return sth;
  }
  // Methods for Generator object
  Generator$1.prototype = {
    constructor: Generator$1,

    // Tom Collins 6/4/2016.
    // Defining a modulo function because by default the modulus of a negative
    // number in javascript is negative.
    mod: function(a, n){
      return a - (n*Math.floor(a/n))
    },

    get_lyrics_from_states: function(stateContextPairs, param){
      const stateType = param.stateType;
      // Make a fresh copy because I was getting some weird-ass problems with idx.
      let scp = JSON.parse(JSON.stringify(stateContextPairs));
      // console.log("scp:", scp)
      // Unpack states into a string.
      console.log("scp[0]:", scp[0]);
      let lyrics = "";
      scp.forEach(function(s){
        lyrics += s[stateType][0] + " ";
      });
      lyrics += scp[scp.length - 1][stateType][1];
      // lyrics = lyrics.slice(0, -1)
      // Too clever, doesn't work!
      // const lyrics = scp.reduce(function(total, s){
      //   return total + " " + s[stateType][0]
      // })
      // console.log("lyrics", lyrics)
      return lyrics
    },

    // Tom Collins 6/4/2016.
    // This function converts beat-relative-MNN states into points consisting of
    // ontimes, MNNs, MPNs, durations, and staff numbers.
    get_points_from_states: function(stateContextPairs, param){
      const self = this;
      const stateType = param.stateType;
      param.pointReconstruction;
      const currTimeSig = param.timeSignatures[0];
      const crotchetBeatsInBar = 4*currTimeSig.topNo/currTimeSig.bottomNo;
      param.indices.ontime;
      const idxMNN = param.indices.MNN;
      const idxMPN = param.indices.MPN;
      param.indices.duration;
      const idxChan = param.indices.channel;
      const idxVel = param.indices.velocity;
      // stateContextPairs, stateType = "beat_rel_sq_MNN_state",
      // currentTimeSignature = { "topNo": 4, "bottomNo": 4 }
      // const idxOn = 0, idxMNN = 1, idxMPN = 2, idxDur = 3, idxChan = 4, idxVel = 5
      // var crotchetBeatsInBar = 4*currentTimeSignature.topNo/currentTimeSignature.bottomNo;

      // Make a fresh copy because I was getting some weird-ass problems with idx.
      let scp = JSON.parse(JSON.stringify(stateContextPairs));
      // console.log("scp:", scp)
      // Unpack states into MNNs and MPNs.
      scp.forEach(function(s){
        let MNNs = [];
        let MPNs = [];
        s.context.orig_points.forEach(function(p){
          const mnnMpnPair = self.state_representation_of_pitch(
            [p[idxMNN], p[idxMPN]], param, s.context.tonic_pitch_closest
          );
          MNNs.push(mnnMpnPair[0]);
          MPNs.push(mnnMpnPair[1]);
        });
        s.MNNs = MNNs;
        s.MPNs = MPNs;
      });

      // Get the ontimes for each state.
      let ons = self.state_ontimes(scp, stateType, crotchetBeatsInBar);
      scp.map(function(s, idx){
        s.ontime = ons[idx];
      });

      // Dovetail durations.
      scp = self.dovetail_durations(scp, param);
      // console.log("scp:", scp)

      // Define points.
      let points = [];
      scp.map(function(s){
        s.MNNs.map(function(m, idx){
          if (!s.dovetailed[idx]){
            points.push([
              s.ontime,
              m,
              s.MPNs[idx],
              s.durations[idx],
              s.context.orig_points[idx][idxChan],
              s.context.orig_points[idx][idxVel]
            ]);
          }
        });
      });
      return points.sort(mu$4.lex_more)
    },

    dovetail_durations: function(stateContextPairs, param){
      const stateType = param.stateType;
      const idxOn = param.indices.ontime;
      param.indices.MNN;
      param.indices.MPN;
      const idxDur = param.indices.duration;
      param.indices.channel;
      param.indices.velocity;
      // Get a last offtime.
      // This is the ontime at which the final selected state began in the original
      // piece.
      const ontimeOfLastState = mu$4.max_argmax(
        stateContextPairs[stateContextPairs.length - 1].context.orig_points.map(function(p){
          return p[idxOn]
        })
      )[0];
      // This is the maximum offtime of a note in that state.
      const offtimeOfLastState = mu$4.max_argmax(
        stateContextPairs[stateContextPairs.length - 1].context.orig_points.map(function(p){
          return p[idxOn] + p[idxDur]
        })
      )[0];
      // The difference between these two,
      // offtimeOfLastState - ontimeOfLastState,
      // will give us an acceptable value for an offtime for the final selected
      // state in the new context, when added to the ontime for the final selected
      // state.
      const lastOfftime = stateContextPairs[stateContextPairs.length - 1].ontime +
      offtimeOfLastState - ontimeOfLastState;
      // console.log("stateContextPairs[stateContextPairs.length - 1].ontime:", stateContextPairs[stateContextPairs.length - 1].ontime)
      // console.log("ontimeOfLastState:", ontimeOfLastState)
      // console.log("offtimeOfLastState:", offtimeOfLastState)
      // console.log("lastOfftime:", lastOfftime)
      // Dovetailing
      // This involves going through each original point and seeing whether it
      // lasted longer than the state to which it belongs. There are three cases to
      // consider:
      // (A) It does not. We assign a duration based on how long it does last in the
      // state and we're done;
      // (B) It does but the same pitch does not appear in the following selected
      // state. We assign a duration up until where the next selected state begins
      // and we're done;
      // (C) It does and the same pitch appears in the following selected state. We
      // carry on the search with this note in the following selected state now, and
      // ask the same questions above (while-loop), until we find (A) or (B) be
      // true. This is the most complex scenario, is tracked using an array called
      // dovetail, and can lead to a pitch being tied across multiple selected
      // states when being turned into a note.

      // Set up durations and dovetailed.
      stateContextPairs.map(function(s){
        s.durations = new Array(s.context.orig_points.length);
        s.dovetailed = new Array(s.context.orig_points.length);
        s.context.orig_points.map(function(p, idx){
          s.durations[idx] = 0;
          s.dovetailed[idx] = false;
        });
      });
      stateContextPairs.map(function(s, idx){
        // console.log("s['beat_MNN_state']:", s['beat_MNN_state'])
        // Ontime where state began in original context.
        const ontimeOfState = mu$4.max_argmax(
          s.context.orig_points.map(function(p){
            return p[idxOn]
          })
        )[0];
        // console.log("ontimeOfState:", ontimeOfState)
        // Durations left in state
        // console.log("orig_points:", s.context.orig_points)
        const dlis = s.context.orig_points.map(function(p){
          return p[idxOn] + p[idxDur] - ontimeOfState
        });
        // console.log("dlis:", dlis)
        // These are the durations we will assign to each note (is parallel with
        // the MNNs and MPNs properties, which should be present).
        s.context.orig_points.map(function(p, kdx){
          // Stands for map into index.
          const mii = s.context.map_into_state[kdx];
          // const m = p[idxMNN]
          // console.log("m:", m)
          // Have a look in the next state.
          let jdx = idx + 1;
          while (jdx <= stateContextPairs.length){
            let compareOntime, lins;
            // Need to be careful about end case, where jdx == stateContextPairs.length
            if (jdx < stateContextPairs.length){
              // Where this next state begins in new context.
              // console.log("Regular case. jdx = " + jdx + ", stateContextPairs[jdx]:", stateContextPairs[jdx])
              compareOntime = stateContextPairs[jdx].ontime;
              // Stands for "look in next state". Is this "pitch" present?
              //***********************************************
              // 26.02.2020. FIXED FOR DIFFERENT STATE TYPES! *
              //***********************************************
              lins = stateContextPairs[jdx][stateType][1]
              .indexOf(s[stateType][1][mii]);
            }
            else {
              // End case.
              // console.log("End case")
              compareOntime = lastOfftime; // Use value calculated above.
              lins = -1; // Nothing to look for.
            }
            // console.log("compareOntime:", compareOntime, "lins:", lins)

            if (dlis[kdx] <= compareOntime - stateContextPairs[jdx - 1].ontime){
              // Case (A)
              // console.log("Case (A)")
              s.durations[kdx] += dlis[kdx];
              jdx = stateContextPairs.length;
            }
            else if (lins == -1){
              // Case (B)
              // console.log("Case (B)")
              s.durations[kdx] += compareOntime - stateContextPairs[jdx - 1].ontime;
              jdx = stateContextPairs.length;
            }
            else {
              // Case (C)
              // console.log("Case (C)")
              s.durations[kdx] += compareOntime - stateContextPairs[jdx - 1].ontime;
              stateContextPairs[jdx].dovetailed[lins] = true;
              // s.dovetailed[kdx] = true
            }
            jdx++;
          }
        });
        // console.log("s.durations:", s.durations, "s.dovetailed:", s.dovetailed)
      });
      return stateContextPairs
    },

    state_ontimes: function(
      stateContextPairs, stateType = "beat_rel_sq_MNN_state", crotchetBeatsInBar = 4
    ){
      let interStateDurations = stateContextPairs.map(function(s, idx){
        if (idx > 0){
          let d = s[stateType][0] - stateContextPairs[idx - 1][stateType][0];
          if (d < 0){
            d = mu$4.mod(d, crotchetBeatsInBar);
          }
          else if (d == 0){
            d = crotchetBeatsInBar;
          }
          return d
        }
      });
      // console.log("interStateDurations:", interStateDurations)
      interStateDurations = interStateDurations.slice(1);
      const ontimes = new Array(stateContextPairs.length);
      ontimes[0] = stateContextPairs[0][stateType][0] - 1;
      interStateDurations.map(function(isd, idx){
        ontimes[idx + 1] = ontimes[idx] + isd;
      });
      // console.log("ontimes:", ontimes)
      return ontimes
    },

    state_representation_of_pitch: function(midiMorphPair, param, tpc){
      const pointReconstruction = param.pointReconstruction;
      const squashRange = param.squashRangeMidiMorph;
      let mnn = midiMorphPair[0], mpn = midiMorphPair[1];
      switch (pointReconstruction){
        case "rel_sq_MNN":
        // Remove tonic pitch closest.
        mnn -= tpc[0];
        mpn -= tpc[1];
        // Squash.
        while (mnn > squashRange[0] || mnn < -squashRange[0]){
          if (mnn > squashRange[0]){
            mnn -= squashRange[0];
            mpn -= squashRange[1];
          }
          else {
            mnn += squashRange[0];
            mpn += squashRange[1];
          }
        }
        break
        case "rel_MNN":
        // Remove tonic pitch closest.
        mnn -= tpc[0];
        mpn -= tpc[1];
        break
        case "MNN":
        // No manipulation required.
        break
        default:
        console.log("SHOULD NOT GET HERE!");
      }
      return [mnn, mpn]
    },

    get_suggestion: function(param){
      const stateType = param.stateType;
      const stm = param.stm;
      const initial = param.initial;
      param.nosConsecutives;
      const ontimeUpperLimit = param.ontimeUpperLimit;
      let randCount = param.randCount;
      const idxOn = param.indices.ontime;
      // const defaultTimeSig = { "topNo": 4, "bottomNo": 4 }
      // console.log('stm[0][' + stateType + ']:', stm[0][stateType]);
      // console.log('stm[5][' + stateType + ']:', stm[5][stateType]);

      // Either take an initial provided state, choose one from the provided initial
      // distribution, or choose one from beat 1 of the stm.
      if (initial !== null){
        // It's an initial provided state or an initial distribution.
        if (initial[stateType] !== undefined){
          // It's an initial provided state.
          var lkState = initial;
        }
        else {
          // It's an initial distribution.
          var lkState = mu$4.choose_one(initial);
          randCount++;
        }
      }
      else {
        // Choose an initial state from beat 1 of the stm.
        var lkState = mu$4.choose_one(
          stm.filter(function(sc){
            return sc[stateType][0] == 1
          })
        );//[stateType]
        randCount++;
      }
      // console.log("lkState:", lkState)
      let lastOntime = lkState[stateType][0] - 1;
      // console.log("lastOntime:", lastOntime)
      // var lk_beat = lkState[0]
      // var lk_mnns = lkState[1]
      // console.log('lk_beat:', lk_beat);
      // console.log('lk_mnns:', lk_mnns);
      // Not using state string right now, but here's an example.
      // var lkState_str = '1.5|48,60,67'; // Just an example.
      // var lk_beat = parseFloat(lkState_str.split('|')[0]);
      // var lkState = [lk_beat, lk_mnns];
      // var lk_mnns = lkState_str.split('|')[1].split(',').map(function(m){ return parseFloat(m) });

      // Use lkState and subsequent continuations to query the stm 40 times.
      let stateCtxPairs = [lkState], points;
      lkState = lkState[stateType];
      // console.log("stateCtxPairs:", stateCtxPairs)
      // var nSt = 40; // This is the number of continuations.
      // for (iSt = 0; iSt < nSt; iSt++){
      while (lastOntime <= ontimeUpperLimit){
        var relIdx = mu$4.array_object_index_of_array(stm, lkState, stateType);
        // console.log('relIdx:', relIdx);
        if (relIdx == -1){
          console.log("Early stop: state was not found in the stm.");
          break
          // return
          // Choose a state at random.
          // relIdx = mu.get_random_int(0, stm.length);
          // console.log('rand populated relIdx:', relIdx);
        }
        // Use it to grab continuations and pick one at random.
        var conts = stm[relIdx].continuations;
        // console.log('stm[relIdx][stateType]:', stm[relIdx][stateType], 'conts.length:', conts.length);
        var currCont = mu$4.choose_one(conts);
        randCount++;
        stateCtxPairs.push(currCont);

        points = this.get_points_from_states(stateCtxPairs, param);
        lastOntime = points[points.length - 1][idxOn];

        // Update lkState.
        lkState = currCont[stateType];
        // console.log('new lkState:', lkState);
      }

      // Rest filtering done at analysis stage, but just checking.
      // console.log("stateCtxPairs pre-rest filter:", stateCtxPairs.length)
      // stateCtxPairs = stateCtxPairs.filter(function(sc){
      //   return sc.beat_MNN_state[1].length > 0;
      // })
      // console.log("stateCtxPairs post-rest filter:", stateCtxPairs.length)
      // console.log("stateCtxPairs.slice(0, 5):", stateCtxPairs.slice(0, 5))
      // stateCtxPairs.map(function(scPair){
      //   console.log("scPair.context.piece_id:", scPair.context.piece_id)
      // })
      return {
        "randCount": randCount,
        "stateContextPairs": stateCtxPairs,
        "points": points
      }

      // // Converts [ beat, [MNNs]] format to 'beat|MNN1,MNN2,...,MNNn' format.
      // stateCtxPairs = stateCtxPairs.map(function(sc){
      //   var state_str = sc.beat_MNN_state[0].toString() + "|";
      //   for (imnn = 0; imnn < sc.beat_MNN_state[1].length; imnn++){
      //     state_str = state_str + sc.beat_MNN_state[1][imnn].toString() + ',';
      //   }
      //   if (imnn > 0){
      //     state_str = state_str.slice(0, state_str.length - 1);
      //   }
      //   return {
      //     beatMNNState: state_str,
      //     orig_points: sc.context.orig_points.map(function(p){
      //       return {
      //         ontime: p[0],
      //         MNN: p[1],
      //         MPN: p[2],
      //         duration: p[3],
      //         staffNo: 3,                           // WARNING THIS IS SUPER HACKY!!
      //         velocity: p[5]
      //       }
      //     }),
      //     pieceId: sc.context.piece_id
      //   };
      // })
      // // console.log('stateCtxPairs:', stateCtxPairs);

      // var suggested_notes = getNotesFromStates(
      //   stateCtxPairs, comp.notes, comp.timeSignatures, 0
      // );
      // var segs = segment(comp_obj2note_point_set({ notes: suggested_notes }));
      // // We need all notes with ontimes greater than or equal to
      // // segs[0].ontime, and less than or equal to
      // // segs[0].ontime + 8 (assuming 4-4 time).
      // suggested_notes = suggested_notes.filter(function(n){
      //   return n.ontime >= segs[0].ontime && n.ontime <= segs[0].ontime + 8;
      // });
      // // console.log('suggested_notes:', suggested_notes);
      // comp.addNotes(suggested_notes);
      // // console.log("comp.notes:", comp.notes);
      // return comp;

    },

    get_lyrics_suggestion: function(param){
      const stateType = param.stateType;
      const stm = param.stm;
      const initial = param.initial;
      param.nosConsecutives;
      const wordLimit = param.wordLimit;
      let randCount = param.randCount;
      // const defaultTimeSig = { "topNo": 4, "bottomNo": 4 }
      console.log('stm[0][' + stateType + ']:', stm[0][stateType]);
      console.log('stm[5][' + stateType + ']:', stm[5][stateType]);

      // Either take an initial provided state, choose one from the provided initial
      // distribution, or choose one from beat 1 of the stm.
      if (initial !== null){
        // It's an initial provided state or an initial distribution.
        if (initial[stateType] !== undefined){
          // It's an initial provided state.
          var lkState = initial;
        }
        else {
          // It's an initial distribution.
          var lkState = mu$4.choose_one(initial);
          randCount++;
        }
      }
      else {
        // Choose an initial state from beat 1 of the stm.
        var lkState = mu$4.choose_one(
          stm.filter(function(sc){
            return sc.context.index_in_line == 0
          })
        );//[stateType]
        randCount++;
      }
      console.log("lkState:", lkState);
      let nosWords = 1;

      // Use lkState and subsequent continuations to query the stm.
      let stateCtxPairs = [lkState], words;
      lkState = lkState[stateType];
      console.log("stateCtxPairs:", stateCtxPairs);
      while (nosWords <= wordLimit){
        var relIdx = mu$4.array_object_index_of_array(stm, lkState, stateType);
        console.log('relIdx:', relIdx);
        if (relIdx == -1){
          console.log("Early stop: state was not found in the stm.");
          break
        }
        // Use it to grab continuations and pick one at random.
        var conts = stm[relIdx].continuations;
        console.log('stm[relIdx][stateType]:', stm[relIdx][stateType], 'conts.length:', conts.length);
        var currCont = mu$4.choose_one(conts);
        randCount++;
        stateCtxPairs.push(currCont);

        words = get_lyrics_from_states(stateCtxPairs, param);
        nosWords++;

        // Update lkState.
        lkState = currCont[stateType];
        console.log('new lkState:', lkState);
      }

      return {
        "randCount": randCount,
        "stateContextPairs": stateCtxPairs,
        "words": words
      }

    }

  };

  // Imports
  const mu$3 = require('maia-util');
  // import get_points_from_states from './Generator'

  // Constructor for PatternGenerator object
  function PatternGenerator$1(_onBgn, _onEnd, _midiBgn, _trans){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.onBgn = _onBgn; // Ontime of first segment of first occurrence.
    this.onEnd = _onEnd; // Ontime of last segment of first occurrence.
    this.midiBgn = _midiBgn; // MIDI note of lowest note in first segment.
    this.trans = _trans; // Translation vectors for all occurrences of the pattern.
    this.an = new Analyzer$1;
    this.gn = new Generator$1;
    // Possible to return something.
    // return sth;
  }
  // Methods for PatternGenerator object
  PatternGenerator$1.prototype = {
    constructor: PatternGenerator$1,

    generate_with_shortest_path: function(nCand, param){
      let self = this;
      // Shorten a few parameters names.
      const stateType = param.stateType;
      const g = param.graph;
      param.indices.ontime;

      // Iterate until we have enough candidates.
      let stateSequences = new Array(nCand);
      let iCand = 0, nosAttempts = 1;

      // Set initial and final states.
      const initialObj = this.get_initial("initial", param);
      param.randCount = initialObj.randCount;
      const initialScPair = initialObj.stateContextPair;
      const finalObj = this.get_initial("final", param);
      param.randCount = finalObj.randCount;
      const finalScPair = finalObj.stateContextPair;

      // Does a (shortest) path exist between initial and final?
      const initialStr = self.an.state2string(initialScPair[stateType]);
      // console.log("initialStr:", initialStr)
      const finalStr = self.an.state2string(finalScPair[stateType]);
      // console.log("finalStr:", finalStr)
      const shortPath = g.print_shortest_path(initialStr, finalStr);
      if (shortPath !== undefined){
        stateSequences[iCand] = shortPath;
        iCand++;
      }
      // To get up to the number of candidates we need, allow freedom in new
      // "final" state and "initial" state partway through the requested passage.
      while(iCand < nCand){
        // Set the "free" initial and final states.
        const initialFreeObj = this.get_initial("initial", param);
        param.randCount = initialFreeObj.randCount;
        const initialFreeScPair = initialFreeObj.stateContextPair;
        const finalFreeObj = this.get_initial("final", param);
        param.randCount = finalFreeObj.randCount;
        const finalFreeScPair = finalFreeObj.stateContextPair;
        // Do shortest paths exist?
        const initialFreeStr = self.an.state2string(initialFreeScPair[stateType]);
        // console.log("initialFreeStr:", initialFreeStr)
        const finalFreeStr = self.an.state2string(finalFreeScPair[stateType]);
        // console.log("finalFreeStr:", finalFreeStr)
        const shortPathA = g.print_shortest_path(initialStr, finalFreeStr);
        // console.log("shortPathA:", shortPathA)
        const shortPathB = g.print_shortest_path(initialFreeStr, finalStr);
        // console.log("shortPathB:", shortPathB)
        if (shortPathA !== undefined && shortPathB !== undefined){
          stateSequences[iCand] = shortPathA.concat(shortPathB);
          iCand++;
        }
        nosAttempts++;
      }
      // console.log("stateSequences:", stateSequences)

      // Convert to state-context pairs.
      let scPairSequences = stateSequences.map(function(ss){
        return self.state_sequence2state_context_pairs(ss, param)
      });
      let pointSets = scPairSequences.map(function(scPairInfo){
        return self.gn.get_points_from_states(scPairInfo.stateContextPairs, param)
      });
      // let metrics = self.get_metrics(pointSets)
      // let estStylisticSuccess = self.estimate_stylistic_success(pointSets, metrics)
      let psMetrics = pointSets.map(function(ps, idx){
        return {
          "pointSet": ps,
          "stateCtxPairs": scPairSequences[idx].stateContextPairs,
          // "metrics": metrics[idx],
          // "estStylisticSuccess": estStylisticSuccess[idx]
        }
      });
      // .sort(function(a, b){
      //   return a.estStylisticSuccess - b.estStylisticSuccess
      // })
      return {
        "randCount": param.randCount,
        'nosAttempts': nosAttempts,
        "psMetrics": psMetrics
      }

    },


    exampleDiscPatt: [
      {
        "label": "A",
        "otherProperties": "here",
        "translators": [[0, 0], [12, 0], [28, 0], [40, 0]],
        "occurrences": [
          {
            "label": "A0",
            "ontimeBgn": 0,
            "ontimeEnd": 8,
            "subsetScore": 1
          },
          {
            "label": "A1",
            "ontimeBgn": 12,
            "ontimeEnd": 20,
            "subsetScore": 1
          },
          {
            "label": "A2",
            "ontimeBgn": 28,
            "ontimeEnd": 36,
            "subsetScore": 1
          },
          {
            "label": "A3",
            "ontimeBgn": 40,
            "ontimeEnd": 48,
            "subsetScore": 1
          }
        ]
      },
      {
        "label": "B",
        "otherProperties": "here",
        "translators": [[0, 0], [28, 0]],
        "occurrences": [
          {
            "label": "B0",
            "ontimeBgn": 0,
            "ontimeEnd": 24,
            "subsetScore": 0
          },
          {
            "label": "B1",
            "ontimeBgn": 28,
            "ontimeEnd": 52,
            "subsetScore": 0
          }
        ]
      }
    ],

    generate_with_patterns: function(discoveredPatterns, param){
      const self = this;
      let winsAddressed = [];
      // Calculate max subset scores.
      discoveredPatterns.forEach(function(dp){
        dp.maxArgmaxSubsetScore = mu$3.max_argmax(
          dp.occurrences.map(function(o){ return o.subsetScore })
        );
      });
      // Sort by max subset score.
      discoveredPatterns = discoveredPatterns.sort(function(x, y){
        // DOUBLE-CHECK THIS!
        return x.maxArgmaxSubsetScore[0] - y.maxArgmaxSubsetScore[0]
      });
      // Go through each occurrence of each pattern and see if we can address it.
      discoveredPatterns.forEach(function(dp){
        // Address the occurrence that received the maximum subset score.
        dp.occurrences[dp.maxArgmaxSubsetScore[1]];
        // If we take the example of B0, when we come to it, winsAddressed will
        // already look like this:
        // [[0, 8], [12, 20], [28, 36], [40, 48]]
        // and we'll want the output of generate_time_windows() to be
        // [[8, 12], [20, 28]],
        // acknwoledging that these are the time windows belonging to B0 that
        // still need to be addressed.
        self.generate_time_windows(
          o.ontimeBgn, o.ontimeEnd, winsAddressed
        );

        // Generate content for these time windows.

        // Paste new content to time windows corresponding to translations of this
        // pattern (other occurrences),

      });

      // Generate for time windows that remain unaddressed because they do not
      // feature in any pattern occurrences.
      

    },

    get_initial: function(strRequest, aParam){
      console.log("strRequest:", strRequest);
      const stateType = aParam.stateType;
      let randCount = aParam.randCount;
      let stateCtxPair;

      if (aParam[strRequest] !== null){
        // It's an initial provided state or an initial distribution.
        if (aParam[strRequest][stateType] !== undefined){
          // It's an initial provided state.
          stateCtxPair = aParam[strRequest][stateType];
        }
        else {
          // It's an initial distribution.
          stateCtxPair = mu$3.choose_one(aParam[strRequest]);
          randCount++;
        }
      }
      else {
        // Choose an initial state from beat 1 of the stm.
        stateCtxPair = mu$3.choose_one(
          aParam.stm.filter(function(sc){
            return sc[stateType][0] == 1
          })
        );
        randCount++;
      }

      return {
        "randCount": randCount,
        "stateContextPair": stateCtxPair
      }
    },

    state_sequence2state_context_pairs: function(stateSeq, aParam){
      const self = this;
      const stateType = aParam.stateType;
      let randCount = aParam.randCount;
      let stateCtxPairs = stateSeq.map(function(stateStr, idx){
        console.log("idx:", idx);
        const state = self.an.string2state(stateStr);
        // Locate the state.
        if (idx == 0){ // Edge case
          let relIdx = mu$3.array_object_index_of_array(
            aParam.initial, state, stateType
          );
          return aParam.initial[relIdx]
        }
        else if (idx == stateSeq.length - 1){ // Edge case
          let relIdx = mu$3.array_object_index_of_array(
            aParam.final, state, stateType
          );
          return aParam.final[relIdx]
        }
        else { // Usual case
          // Locate previous state in stm. Then choose from among potentially many
          // continuations with the appropriate state.
          let relIdx = mu$3.array_object_index_of_array(
            aParam.stm, self.an.string2state(stateSeq[idx - 1]), stateType
          );
          console.log("relIdx:", relIdx);
          let candCont = aParam.stm[relIdx].continuations.filter(function(cont){
            // console.log("cont[stateType]:", cont[stateType])
            return cont[stateType].equals(state)
          });
          randCount++;
          return mu$3.choose_one(candCont)
        }
      })
      // When allowing freedom in concatenating two shortest paths, one ending in
      // state A and the other beginning in state B, it is unlikely that B is
      // among the continuations of A, so an undefined value will have crept in,
      // which is removed here.
      .filter(function(scp){
        return scp !== undefined
      });
      // console.log("stateCtxPairs from state_sequence2state_context_pairs():", stateCtxPairs)

      return {
        "randCount": randCount,
        "stateContextPairs": stateCtxPairs
      }
    }


  };

  // Adapted from Google's Closure library.
  // https://github.com/google/closure-library/blob/master/closure/goog/structs/node.js#L24
  // They'd called it Node, which has dangerous overlap with Node.js and isn't
  // very descriptive.

  /**
   * A generic immutable node. This can be used in various collections that
   * require a node object for its item (such as a heap).
   * @param {K} key Key.
   * @param {V} value Value.
   * @constructor
   * @template K, V
   */
  function KeyValuePair$1(key, value) {
    /**
     * The key.
     * @private {K}
     */
    this.key_ = key;

    /**
     * The value.
     * @private {V}
     */
    this.value_ = value;
  }
  /**
   * Gets the key.
   * @return {K} The key.
   */
  KeyValuePair$1.prototype.getKey = function() {
    return this.key_;
  };


  /**
   * Gets the value.
   * @return {V} The value.
   */
  KeyValuePair$1.prototype.getValue = function() {
    return this.value_;
  };


  /**
   * Clones a node and returns a new node.
   * @return {!goog.structs.Node<K, V>} A new goog.structs.Node with the same
   *     key value pair.
   */
  KeyValuePair$1.prototype.clone = function() {
    return new KeyValuePair$1(this.key_, this.value_);
  };

  // Constructor for Vertex object
  function Vertex$1(_name){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.name = _name;
    // Neighbors (nbs) will be an array of Edges.
    this.nbs = [];
    // Useful for calculating shortest path
    this.dist = Infinity;
    this.visited = false;
    this.prev = null; // Will be of type Vertex.
    // Possible to return something.
    // return sth;
  }
  // exports.Vertex = Vertex
  // Methods for Vertex object
  Vertex$1.prototype = {
    constructor: Vertex$1,

    // Currently unused, e.g., because priorities are passed to PQ explicitly.
    compare_to: function(v){
      return this.dist - v.dist
    }
  };

  // Constructor for Edge object
  function Edge$1(_u, _v, _w){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.u = _u;
    this.v = _v;
    this.w = _w;
    // Possible to return something.
    // return sth;
  }
  // Methods for Edge object
  Edge$1.prototype = {
    constructor: Edge$1,

    // sth: function(){}
  };

  // Adapted from Google's Closure library.
  // https://github.com/google/closure-library/blob/master/closure/goog/structs/heap.js#L44


  /**
   * Class for a Heap data structure.
   *
   * @param {goog.structs.Heap|Object=} opt_heap Optional goog.structs.Heap or
   *     Object to initialize heap with.
   * @constructor
   * @template K, V
   */
  function Heap$1(opt_heap) {
    /**
     * The nodes of the heap.
     * @private
     * @type {Array<goog.structs.Node>}
     */
    this.nodes_ = [];

    if (opt_heap) {
      this.insertAll(opt_heap);
    }
  }
  /**
   * Restores heap order property. This one added by me.
   */
  Heap$1.prototype.heapify = function() {
    for (let i = Math.floor(this.nodes_.length/2); i >= 0; i--) {
      this.moveDown_(i);
    }
  };

  /**
   * Removes a specifiable value. This one added by me.
   */
  Heap$1.prototype.removeValue = function(value) {
    const relIdx = this.containsValue(value);
    if (relIdx >= 0){
      this.nodes_.splice(relIdx, -1);
      this.heapify();
    }
  };


  /**
   * Insert the given value into the heap with the given key.
   * @param {K} key The key.
   * @param {V} value The value.
   */
  Heap$1.prototype.insert = function(key, value) {
    var node = new KeyValuePair$1(key, value);
    var nodes = this.nodes_;
    nodes.push(node);
    this.moveUp_(nodes.length - 1);
  };


  /**
   * Adds multiple key-value pairs from another goog.structs.Heap or Object
   * @param {goog.structs.Heap|Object} heap Object containing the data to add.
   */
  Heap$1.prototype.insertAll = function(heap) {
    var keys, values;
    if (heap instanceof Heap$1) {
      keys = heap.getKeys();
      values = heap.getValues();

      // If it is a heap and the current heap is empty, I can rely on the fact
      // that the keys/values are in the correct order to put in the underlying
      // structure.
      if (this.getCount() <= 0) {
        var nodes = this.nodes_;
        for (var i = 0; i < keys.length; i++) {
          nodes.push(new KeyValuePair$1(keys[i], values[i]));
        }
        return;
      }
    } else {
      keys = Object.keys(heap);
      values = Object.values(heap);
    }

    for (var i = 0; i < keys.length; i++) {
      this.insert(keys[i], values[i]);
    }
  };


  /**
   * Retrieves and removes the root value of this heap.
   * @return {V} The value removed from the root of the heap.  Returns
   *     undefined if the heap is empty.
   */
  Heap$1.prototype.remove = function() {
    var nodes = this.nodes_;
    // console.log("this.nodes_.length before removal:", this.nodes_.length)
    var count = nodes.length;
    var rootNode = nodes[0];
    if (count <= 0) {
      return undefined;
    } else if (count == 1) {
      nodes.pop();
      // goog.array.clear(nodes);
    } else {
      nodes[0] = nodes.pop();
      this.moveDown_(0);
    }
    // console.log("this.nodes_.length after removal:", this.nodes_.length)
    return rootNode.getValue();
  };


  /**
   * Retrieves but does not remove the root value of this heap.
   * @return {V} The value at the root of the heap. Returns
   *     undefined if the heap is empty.
   */
  Heap$1.prototype.peek = function() {
    var nodes = this.nodes_;
    if (nodes.length == 0) {
      return undefined;
    }
    return nodes[0].getValue();
  };


  /**
   * Retrieves but does not remove the key of the root node of this heap.
   * @return {K} The key at the root of the heap. Returns undefined if the
   *     heap is empty.
   */
  Heap$1.prototype.peekKey = function() {
    return this.nodes_[0] && this.nodes_[0].getKey();
  };


  /**
   * Moves the node at the given index down to its proper place in the heap.
   * @param {number} index The index of the node to move down.
   * @private
   */
  Heap$1.prototype.moveDown_ = function(index) {
    var nodes = this.nodes_;
    var count = nodes.length;

    // Save the node being moved down.
    var node = nodes[index];
    // While the current node has a child.
    while (index < (count >> 1)) {
      var leftChildIndex = this.getLeftChildIndex_(index);
      var rightChildIndex = this.getRightChildIndex_(index);

      // Determine the index of the smaller child.
      var smallerChildIndex = rightChildIndex < count &&
              nodes[rightChildIndex].getKey() < nodes[leftChildIndex].getKey() ?
          rightChildIndex :
          leftChildIndex;

      // If the node being moved down is smaller than its children, the node
      // has found the correct index it should be at.
      if (nodes[smallerChildIndex].getKey() > node.getKey()) {
        break;
      }

      // If not, then take the smaller child as the current node.
      nodes[index] = nodes[smallerChildIndex];
      index = smallerChildIndex;
    }
    nodes[index] = node;
  };


  /**
   * Moves the node at the given index up to its proper place in the heap.
   * @param {number} index The index of the node to move up.
   * @private
   */
  Heap$1.prototype.moveUp_ = function(index) {
    var nodes = this.nodes_;
    var node = nodes[index];

    // While the node being moved up is not at the root.
    while (index > 0) {
      // If the parent is less than the node being moved up, move the parent down.
      var parentIndex = this.getParentIndex_(index);
      if (nodes[parentIndex].getKey() > node.getKey()) {
        nodes[index] = nodes[parentIndex];
        index = parentIndex;
      } else {
        break;
      }
    }
    nodes[index] = node;
  };


  /**
   * Gets the index of the left child of the node at the given index.
   * @param {number} index The index of the node to get the left child for.
   * @return {number} The index of the left child.
   * @private
   */
  Heap$1.prototype.getLeftChildIndex_ = function(index) {
    return index * 2 + 1;
  };


  /**
   * Gets the index of the right child of the node at the given index.
   * @param {number} index The index of the node to get the right child for.
   * @return {number} The index of the right child.
   * @private
   */
  Heap$1.prototype.getRightChildIndex_ = function(index) {
    return index * 2 + 2;
  };


  /**
   * Gets the index of the parent of the node at the given index.
   * @param {number} index The index of the node to get the parent for.
   * @return {number} The index of the parent.
   * @private
   */
  Heap$1.prototype.getParentIndex_ = function(index) {
    return (index - 1) >> 1;
  };


  /**
   * Gets the values of the heap.
   * @return {!Array<V>} The values in the heap.
   */
  Heap$1.prototype.getValues = function() {
    var nodes = this.nodes_;
    var rv = [];
    var l = nodes.length;
    for (var i = 0; i < l; i++) {
      rv.push(nodes[i].getValue());
    }
    return rv;
  };


  /**
   * Gets the keys of the heap.
   * @return {!Array<K>} The keys in the heap.
   */
  Heap$1.prototype.getKeys = function() {
    var nodes = this.nodes_;
    var rv = [];
    var l = nodes.length;
    for (var i = 0; i < l; i++) {
      rv.push(nodes[i].getKey());
    }
    return rv;
  };


  /**
   * Whether the heap contains the given value.
   * @param {V} val The value to check for.
   * @return {boolean} Whether the heap contains the value.
   */
  Heap$1.prototype.containsValue = function(val) {
    return this.nodes_.findIndex(function(n){
      return n.getValue() == val
    })
    // return goog.array.some(
    //     this.nodes_, function(node) { return node.getValue() == val; });
  };


  /**
   * Whether the heap contains the given key.
   * @param {K} key The key to check for.
   * @return {boolean} Whether the heap contains the key.
   */
  Heap$1.prototype.containsKey = function(key) {
    return this.nodes_.findIndex(function(n){
      return n.getKey() == key
    })
    // return goog.array.some(
    //     this.nodes_, function(node) { return node.getKey() == key; });
  };


  /**
   * Clones a heap and returns a new heap
   * @return {!goog.structs.Heap} A new goog.structs.Heap with the same key-value
   *     pairs.
   */
  Heap$1.prototype.clone = function() {
    return new Heap$1(this);
  };


  /**
   * The number of key-value pairs in the map
   * @return {number} The number of pairs.
   */
  Heap$1.prototype.getCount = function() {
    return this.nodes_.length;
  };


  /**
   * Returns true if this heap contains no elements.
   * @return {boolean} Whether this heap contains no elements.
   */
  Heap$1.prototype.isEmpty = function() {
    return this.nodes_.length == 0
    // return goog.array.isEmpty(this.nodes_);
  };


  /**
   * Removes all elements from the heap.
   */
  Heap$1.prototype.clear = function() {
    this.nodes_ = [];
    // goog.array.clear(this.nodes_);
  };

  // Adapted from Google's Closure library.
  // https://github.com/google/closure-library/blob/master/closure/goog/structs/priorityqueue.js#L34
  // Would be better if PQ inherited Heap rather than using it, but this'll do for
  // now.


  /**
   * Class for Priority Queue datastructure.
   *
   * @constructor
   * @extends {goog.structs.Heap<number, VALUE>}
   * @template VALUE
   * @final
   */
  function PriorityQueue$1() {
    this.heap = new Heap$1();
    // goog.structs.Heap.call(this);
  }// goog.inherits(goog.structs.PriorityQueue, goog.structs.Heap);


  /**
   * Puts the specified value in the queue.
   * @param {number} priority The priority of the value. A smaller value here
   *     means a higher priority.
   * @param {VALUE} value The value.
   */
  PriorityQueue$1.prototype.enqueue = function(priority, value) {
    this.heap.insert(priority, value);
  };


  /**
   * Retrieves and removes the head of this queue.
   * @return {VALUE} The element at the head of this queue. Returns undefined if
   *     the queue is empty.
   */
  PriorityQueue$1.prototype.dequeue = function() {
    // console.log("this.heap.getCount() from beginning of dequeue():", this.heap.getCount())
    const value = this.heap.remove();
    // console.log("this.heap.getCount() from end of dequeue():", this.heap.getCount())
    return value;
    //  return this.heap.remove();
  };

  // Imports
  require('maia-util');

  // Constructor for Graph object
  function Graph$1(arr, vtxStr, nbsStr, distStr){
    // If supplied with an input array, this constructor fills the graph with
    // directed edges by default.
    this.vertexMap = {};
    // Workaround for JS context peculiarities.
    var self = this;
    if (arr !== undefined){
      arr.map(function(a){
        a[nbsStr].map(function(n){
          if (distStr !== undefined){
            self.add_directed_edge(a[vtxStr], n[vtxStr], n[distStr]);
          }
          else {
            self.add_directed_edge(a[vtxStr], n[vtxStr], 1);
          }
        });
      });
    }
    // Possible to return something.
    // return sth;
  }
  // Methods for Graph object
  Graph$1.prototype = {
    constructor: Graph$1,

    add_edge: function(start, end, w){
      const u = this.get_vertex(start);
      const v = this.get_vertex(end);
      u.nbs.push(new Edge$1(u, v, w));
      v.nbs.push(new Edge$1(v, u, w));
    },

    add_directed_edge: function(start, end, w){
      const u = this.get_vertex(start);
      const v = this.get_vertex(end);
      u.nbs.push(new Edge$1(u, v, w));
    },

    get_vertex: function(name){
      let v = this.vertexMap[name];
      if (v == undefined){
        v = new Vertex$1(name);
        this.vertexMap[name] = v;
      }
      return v
    },

    get_neighbors: function(name){
      let v = this.vertexMap[name];
      if (v == undefined){
        console.log("Error: start vertex not found.");
        return
      }
      return v.nbs.map(function(nb){
        return nb.v.name
      })
    },

    print_neighbors: function(name){
      let v = this.vertexMap[name];
      if (v == undefined){
        console.log("Error: start vertex not found.");
        return
      }
      let str = "";
      v.nbs.map(function(nb){
        str += nb.v.name + ", ";
      });
      return str
    },

    // Could write one of these, because there's too much code copy/paste at the
    // beginnings of bfs, dfs, and shortest_path below.
    // prep_for_search: function(startName){}

    // Untested breadth-first search
    bfs: function(startName){
      let startVertex = this.vertexMap[startName];
      if (startVertex == undefined){
        console.log("Error: start vertex not found.");
        return
      }

      this.reset();
      startVertex.dist = 0;
      let dq = [startVertex];
      while (dq.length > 0){
        const u = dq.shift();
        console.log(u.name + " " + u.dist);
        u.nbs.map(function(nb){
          let v = nb.v;
          if (v.dist == Infinity){
            v.dist = u.dist + 1;
            dq.push(v);
          }
        });
      }
    },

    // Untested depth-first search
    dfs: function(startName){
      let startVertex = this.vertexMap[startName];
      if (startVertex == undefined){
        console.log("Error: start vertex not found.");
        return
      }

      this.reset();
      startVertex.visited = true;
      let dq = [startVertex];
      while (dq.length > 0){
        const u = dq.pop();
        console.log(u.name);
        u.nbs.map(function(nb){
          let v = nb.v;
          if (!v.visited){
            v.visited = true;
            dq.push(v);
          }
        });
      }
    },

    // Untested recursive depth-first search
    // No reseting here, which is a potential problem.
    recursive_dfs: function(u){
      u.visited = true;
      console.log(u.name);
      u.nbs.map(function(nb){
        let v = nb.v;
        if (!v.visited){
          this.recursive_dfs(v);
        }
      });
    },

    shortest_path: function(startName){
      let startVertex = this.vertexMap[startName];
      if (startVertex == undefined){
        console.log("Error: start vertex not found.");
        return
      }

      this.reset();
      let q = new PriorityQueue$1();
      startVertex.dist = 0;
      q.enqueue(startVertex.dist, startVertex);
      // console.log("q:", q)

      while (!q.heap.isEmpty()){
        let u = q.dequeue();
        if (u.visited) continue
        u.visited = true;
        // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
        u.nbs.map(function(nb){
          let v = nb.v;
          if (v.dist > u.dist + nb.w){
            q.heap.removeValue(v);
            v.dist = u.dist + nb.w;
            v.prev = u;
            q.enqueue(v.dist, v);
          }
        });
      }
    },

    print_shortest_path: function(startName, endName){
      this.shortest_path(startName);
      let relVtx = this.get_vertex(endName);
      if (!relVtx.visited){
        // These two vertices are not connected.
        return
      }
      let rv = [endName];
      while (relVtx.prev !== null){
        rv.push(relVtx.prev.name);
        relVtx = this.get_vertex(relVtx.prev.name);
      }
      return rv.reverse()
    },

    scenic_path: function(startName, loveOfScenery){
      let startVertex = this.vertexMap[startName];
      if (startVertex == undefined){
        console.log("Error: start vertex not found.");
        return
      }

      this.reset();
      let q = new PriorityQueue$1();
      startVertex.dist = 0;
      q.enqueue(startVertex.dist, startVertex);
      // console.log("q:", q)

      while (!q.heap.isEmpty()){
        let u = q.dequeue();
        if (u.visited) continue
        u.visited = true;
        // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
        u.nbs.map(function(nb){
          let v = nb.v;
          if (
            // The next line is intended to avoid the undefined error in beginning
            // to construct the shortest path.
            v.dist === Infinity ||
            (
              // If true, there's a better way to get to vertex v.
              (v.dist > u.dist + nb.w) &&
              Math.random() > loveOfScenery
            )
          ){
            // Update the heap with the more efficient route.
            q.heap.removeValue(v);
            v.dist = u.dist + nb.w;
            v.prev = u;
            q.enqueue(v.dist, v);
          }
        });
      }
    },

    print_scenic_path: function(startName, endName, loveOfScenery){
      this.scenic_path(startName, loveOfScenery);
      let relVtx = this.get_vertex(endName);
      if (!relVtx.visited){
        // These two vertices are not connected.
        return
      }
      let rv = [endName];
      while (relVtx.prev !== null){
        rv.push(relVtx.prev.name);
        relVtx = this.get_vertex(relVtx.prev.name);
      }
      return rv.reverse()
    },

    reset: function(){
      let self = this;
      Object.keys(this.vertexMap).map(function(v){
        self.vertexMap[v].dist = Infinity;
        self.vertexMap[v].visited = false;
        self.vertexMap[v].prev = null;
      });
    }


  };

  // Imports
  // import fs
  const fs$3 = require('fs');
  const pa = require('path');
  const { Midi: Midi$1 } = require('@tonejs/midi');
  const mu$2 = require('maia-util');

  /**
   * Class for importing MIDI files and extracting information from them.
   */
  let MidiImport$1 = class MidiImport {
    /**
     * Constructor for the MidiImport class.
     * @param {string} _fpath - The file path of the MIDI file.
     * @param {function} _f - The function for returning the nth Farey set.
     * @param {number} _anc - The anacrusis value.
     */
    constructor(_fpath, _f = mu$2.farey(4), _anc = 0){
      // Workaround for JS context peculiarities.
      // var self = this;
      this.fpath = _fpath;
      this.data = this.get_data(this.fpath);
      this.timeSigs = this.get_time_sigs();
      this.anacrusis = _anc;
      this.points = this.get_points();
      // this.points.slice(0, 3).forEach(function(p, i){
      //   console.log("points[" + i + "]:", p)
      // })
      this.controlChanges = this.get_control_changes();
      this.compObj = this.get_comp_obj(_f);
      // Possible to return something.
      // return sth;
    }

    /**
     * Finds the bass track in the MIDI file.
     * @return {Array} candidates - The array of candidates for bass tracks.
     */
    find_bass_track(){
      const tracks = this.data.tracks;
      const trg = [
        ["bass"]
      ];
      let candidates = [];
      let synthCandidates = []; // In absence of bass family, accept this.
      // First phase of finding.
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family;
        const nam = trk.instrument.name;
        trg.forEach(function(t){
          if (fam === t[0]){
            candidates.push([idx, fam + " -> " + nam]);
          }
        });
        if (fam === "synth lead" && nam === "lead 8 (bass + lead)"){
          synthCandidates.push([idx, "synth lead -> lead 8 (bass + lead)"]);
        }
      });

      // Remove any empty tracks.
      candidates = candidates.filter(function(c){
        return tracks[c[0]].notes.length > 0
      });
      synthCandidates = synthCandidates.filter(function(c){
        return tracks[c[0]].notes.length > 0
      })
      .sort(function(a, b){
        return tracks[b[0]].notes.length - tracks[a[0]].notes.length
      });

      if (candidates.length === 0){
        if (synthCandidates.length > 0){
          console.log("Found a suitable synth instead in absence of any bass.");
          return [synthCandidates[0]]
        }
        console.log("No bass track targets identified. Returning undefined.");
        tracks.forEach(function(trk, idx){
          const fam = trk.instrument.family;
          const nam = trk.instrument.name;
          console.log("fam:", fam, ", nam:", nam);
        });
        return
      }
      if (candidates.length === 1){
        return candidates
      }

      console.log("Multiple bass track targets identified. Returning them.");
      console.log("candidates:", candidates);
      candidates.forEach(function(c){
        const fam = tracks[c[0]].instrument.family;
        const nam = tracks[c[0]].instrument.name;
        console.log("fam:", fam, ", nam:", nam);
        console.log("tracks[c[0]].notes.length:", tracks[c[0]].notes.length);
      });
      return candidates
    }

    /**
     * Finds the drum track in the MIDI file.
     * @return {Array} candidates - The array of candidates for drum tracks.
     */
    find_drum_track(){
      const tracks = this.data.tracks;
      const trg = [
        ["drums"]
      ];
      let candidates = [];
      // First phase of finding.
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family;
        const nam = trk.instrument.name;
        trg.forEach(function(t){
          if (fam === t[0]){
            candidates.push([idx, fam + " -> " + nam]);
          }
        });
      });

      // Remove any empty tracks.
      candidates = candidates.filter(function(c){
        return tracks[c[0]].notes.length > 0
      });

      if (candidates.length === 0){
        console.log("No drum track targets identified. Returning undefined.");
        tracks.forEach(function(trk, idx){
          const fam = trk.instrument.family;
          const nam = trk.instrument.name;
          console.log("fam:", fam, ", nam:", nam);
        });
        return
      }
      if (candidates.length === 1){
        return candidates
      }

      console.log("Multiple drum track targets identified. Returning them.");
      console.log("candidates:", candidates);
      candidates.forEach(function(c){
        const fam = tracks[c[0]].instrument.family;
        const nam = tracks[c[0]].instrument.name;
        console.log("fam:", fam, ", nam:", nam);
        console.log("tracks[c[0]].notes.length:", tracks[c[0]].notes.length);
      });
      return candidates
    }

    /**
     * Finds the homophonic track in the MIDI file.
     * @return {Array} candidates - The array of candidates for homophonic tracks.
     */
    find_homophonic_track(){
      const self = this;
      const tracks = self.data.tracks.filter(function(trk){
        return trk.instrument.family !== "drums" && trk.notes.length > 50
      });

      let homophonyScores = tracks.map(function(trk, idx){
        const points = trk.notes.map(function(n){
          return [
            n.ticks/self.data.header.ppq,
            n.midi,
            null,
            n.durationTicks/self.data.header.ppq,
            tracks[idx].channel,
            Math.round(1000*n.velocity)/1000
          ]
        });
        const seg = mu$2.segment(points, false);
        let homoCount = 0;
        seg.forEach(function(s){
          if (s.points.length >= 2){
            homoCount += s.points.length;
          }
        });
        return { "idx": idx, "score": homoCount/seg.length }
      })
      .sort(function(a, b){
        return b.score - a.score
      });
      console.log("homophonyScores:", homophonyScores);
      if (
        homophonyScores.length > 0 &&
        homophonyScores[0]["score"] >= 2
      ){
        const relIdx = homophonyScores[0]["idx"];
        return [
          relIdx,
          tracks[relIdx].instrument.family + " -> " + tracks[relIdx].instrument.name,
          homophonyScores[0]["score"]
        ]
      }
    }

    /**
     * Finds the vocal track in the MIDI file.
     * @return {Array} candidates - The array of candidates for vocal tracks.
     */
    find_vocal_track(){
      const self = this;
      const tracks = self.data.tracks;
      const trg = [
        ["reed", "alto sax"],
        ["synth lead", "lead 8 (bass + lead)"],
        ["reed", "clarinet"],
        ["reed", "soprano sax"],
        ["reed", "tenor sax"],
        ["reed", "baritone sax"],
        ["pipe", "flute"],
        ["brass", "french horn"],
        ["strings", "cello"],
        ["organ", "rock organ"],
        ["ensemble", "voice oohs"],
        ["guitar", "electric guitar (clean)"],
        ["guitar", "electric guitar (jazz)"],
        ["brass", "brass section"],
        ["reed", "oboe"],
        ["brass", "synthbrass 1"],
        ["guitar", "acoustic guitar (steel)"],
        ["synth pad", "pad 3 (polysynth)"],
        ["synth pad", "pad 4 (choir)"],
        ["piano", "acoustic grand piano"],
        ["strings", "viola"],
        ["brass", "muted trumpet"],
        ["ensemble", "synth voice"],
        ["strings", "violin"],
        ["guitar", "overdriven guitar"],
        ["guitar", "acoustic guitar (nylon)"],
        ["guitar", "distortion guitar"],
        ["guitar", "electric guitar (muted)"],
        ["piano", "bright acoustic piano"]
      ];
      let candidates = [];
      // First phase of finding.
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family;
        const nam = trk.instrument.name;
        // console.log("fam:", fam, ", nam:", nam)

        trg.forEach(function(t){
          if (fam === t[0]){
            if (fam === "synth lead"){
              if (nam === t[1]){
                candidates.push([idx, fam + " -> " + nam]);
              }
              else {
                candidates.push([idx, "generic synth lead"]);
              }
            }
            else {
              if (nam === t[1]){
                candidates.push([idx, fam + " -> " + nam]);
              }
            }
          }
        });

      });
      // Remove any empty tracks.
      candidates = candidates.filter(function(c){
        return tracks[c[0]].notes.length > 0
      });

      if (candidates.length === 0){
        console.log("No vocal track targets identified. Returning undefined.");
        tracks.forEach(function(trk, idx){
          const fam = trk.instrument.family;
          const nam = trk.instrument.name;
          console.log("fam:", fam, ", nam:", nam);
        });
        return
      }
      if (candidates.length === 1){
        return candidates[0]
      }

      // Second phase. Choosing between multiple piano tracks.
      if (
        candidates.length > 1 &&
        candidates.every(function(c){
          return c[1] === "piano -> acoustic grand piano"
        })
      ){
        // Sometimes there are multiple instances of piano -> acoustic grand piano.
        // I'm going to search for and return the most monophonic of those.
        console.log("candidates:", candidates);
        let monophonyScores = candidates.map(function(c){
          const points = tracks[c[0]].notes.map(function(n){
            return [
              n.ticks/self.data.header.ppq,
              n.midi,
              null,
              n.durationTicks/self.data.header.ppq,
              tracks[c[0]].channel,
              Math.round(1000*n.velocity)/1000
            ]
          });
          console.log("points.length:", points.length);
          console.log("points.slice(0, 5):", points.slice(0, 5));
          const seg = mu$2.segment(points, false);
          let monoCount = 0;
          seg.forEach(function(s){
            if (s.points.length < 2){
              monoCount++;
            }
          });
          return monoCount/seg.length
        });
        console.log("monophonyScores:", monophonyScores);
        const ma = mu$2.max_argmax(monophonyScores);
        return candidates[ma[1]]
      }

      // Third phase. Return first match in case of multiple matches.
      let i = 0;
      let relIdx = -1;
      while (i < trg.length && relIdx < 0){
        relIdx = candidates.findIndex(function(c){
          return c[1] === trg[i][0] + " -> " + trg[i][1]
        });
        if (relIdx >= 0){
          i = trg.length - 1;
        }
        i++;
      }
      if (relIdx >= 0){
        return candidates[relIdx]
      }

      // Fourth phase of finding
      // Sometimes there are multiple of synth lead, I'm returning the first
      // encountered.
      relIdx = candidates.findIndex(function(c){
        return c[1] === "generic synth lead"
      });
      if (relIdx >= 0){
        return candidates[relIdx]
      }

      console.log("\n!! Vocal track determination unclear !!");
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family;
        const nam = trk.instrument.name;
        console.log("fam:", fam, ", nam:", nam);
      });
    }

    /**
     * Gets the comp obj for the MIDI file.
     * @param {function} f - The function for returning the nth Farey set.
     * @return {object} comp - The comp obj for the MIDI file.
     */
    get_comp_obj(f){
      // const fsm = mu.fifth_steps_mode(this.points, mu.krumhansl_and_kessler_key_profiles)
      // console.log("fsm:", fsm)
      // this.points.map(function(p){
      //   p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      // })
      const an = new Analyzer$1;
      let comp = an.note_point_set2comp_obj(
        this.points, this.timeSigs, false, f, 0, 1, 2, 3, 4
      );
      console.log("comp.notes.length:", comp.notes.length);
      // Control changes.
      if (this.controlChanges !== undefined) {
        if (comp.miscImport === undefined) {
          comp.miscImport = {};
        }
        if (comp.miscImport.midi === undefined) {
          comp.miscImport.midi = {};
        }
        comp.miscImport.midi.controlChange = this.controlChanges;
      }

      // Strip off file extension.
      const pFile = pa.basename(this.fpath, pa.extname(this.fpath));
      comp["id"] = pFile;
      comp["name"] = pFile;
      comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}];
      return comp
    }

    /**
     * Gets the control changes for the MIDI file.
     * @param {number} anacrusis - The anacrusis value.
     * @return {Array} cc - The array of control changes for the MIDI file.
     */
    get_control_changes(anacrusis){
      const self = this;
      const cc = self.data.tracks.map(function(track){
        const ccCurrTrack = {};
        const props = Object.keys(track.controlChanges);
        props.forEach(function(p){
          ccCurrTrack[p] = track.controlChanges[p].map(function(c){
            const obj = mu$2.timelapse_object();
            obj.ontime = Math.round(100000*(c.ticks/self.data.header.ppq - anacrusis))/100000;
            // What about the anacrusis effect on onset?!
            obj.onset = Math.round(100000*c.time)/100000;
            obj.value = Math.round(100000*c.value)/100000;
            return obj
          });
        });
        return ccCurrTrack
      });
      return cc
    }

    /**
     * Gets the data from the MIDI file.
     * @return {object} midiData - The data from the MIDI file.
     */
    get_data(){
      const midiData = fs$3.readFileSync(this.fpath);
      return new Midi$1(midiData)
    }

    /**
     * Gets the phrase boundary ontimes for the MIDI file.
     * @param {number} [restDur=1] - The rest duration.
     * @param {string} [property="offtime"] - The property of the phrase boundary.
     * @return {Array} pbo - The array of phrase boundary ontimes for the MIDI file.
     */
    get_phrase_boundary_ontimes(restDur = 1, property = "offtime"){
      let pbo = [];
      const segs = mu$2.segment(this.points, true, 0, 2);
      segs.forEach(function(seg, idx){
        if (seg.points.length == 0 && seg.offtime - seg.ontime >= restDur){
          pbo.push(seg[property]);
          // Fixed this bug where property wasn't being used...
          // pbo.push(seg.offtime)
        }
      });
      return pbo
    }

    /**
     * Get points from the MIDI file
     *
     * @param {number} anacrusis - Anacrusis, the unaccented beats at the beginning of a musical phrase
     * @return {array} points - List of sorted points
     */
    get_points(){
      const self = this;
      let points = [];
      self.data.tracks.forEach(function(track, index){
        track.notes.forEach(function(n){
          points.push([
            n.ticks/self.data.header.ppq,
            n.midi,
            n.durationTicks/self.data.header.ppq,
            index,
            Math.round(1000*n.velocity)/1000
          ]);
        });
      });
      const unqPoints = mu$2.unique_rows(points, true)[0];
      const minOntime = unqPoints[0][0];
      if (this.anacrusis === "Shift to zero"){
        unqPoints.forEach(function(pt){
          pt[0] -= minOntime;
        });
      }
      else if (this.anacrusis > 0){
        unqPoints.forEach(function(pt){
          pt[0] -= this.anacrusis;
        });
      }
      // Update anacrusis so it is no longer a string value.
      this.anacrusis = unqPoints[0][0];
      return unqPoints

      // Old version that just used sort_rows(), which isn't good enough if the
      // MIDI file happens to contain duplicate events.
      // const sortedPoints = mu.sort_rows(points)[0]
      // const minOntime = sortedPoints[0][0]
      // if (this.anacrusis === "Shift to zero"){
      //   sortedPoints.forEach(function(pt){
      //     pt[0] -= sortedPoints[0][0]
      //   })
      // }
      // else if (anacrusis > 0){
      //   sortedPoints.forEach(function(pt){
      //     pt[0] -= anacrusis
      //   })
      // }
      // // Update anacrusis so it is no longer a string value.
      // this.anacrusis = sortedPoints[0][0]
      // return sortedPoints
    }

    /**
     * Get time signatures from the MIDI file
     *
     * @return {array} timeSigs - List of time signatures with bar number, top number, bottom number, and ontime
     */
    get_time_sigs(){
      const self = this;
      // Set defaul timeSigs.
      let timeSigs = [
        { "barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0 }
      ];
      if (
        self.data.header &&
        self.data.header.timeSignatures &&
        self.data.header.timeSignatures.length > 0
      ){
        // Some meaningful time signature data are present, so import them.
        timeSigs = [self.data.header.timeSignatures.map(function(ts){
          return {
            "barNo": ts.measures + 1,
            "topNo": ts.timeSignature[0],
            "bottomNo": ts.timeSignature[1],
            "ontime": ts.ticks/self.data.header.ppq
          }
        })[0]];
      }
      console.log("timeSigs:", timeSigs);
      return timeSigs
    }
  };

  // Imports
  // import fs
  const fs$2 = require('fs');
  const { Midi } = require('@tonejs/midi');
  const mu$1 = require('maia-util');

  // Constructor for MidiExport object
  function MidiExport$1(
    _points, _controlChanges, _fpath, _param = {
      "scaleFactor": 1,
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
  ){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.points = _points;
    this.controlChanges = _controlChanges;
    this.fpath = _fpath;
    this.scaleFactor = _param.scaleFactor;
    this.timeSigTopNo = _param.timeSigTopNo;
    this.timeSigBottomNo = _param.timeSigBottomNo;
    this.noteIndices = {};
    this.noteIndices.ontimeIndex = _param.noteIndices.ontimeIndex;
    this.noteIndices.mnnIndex = _param.noteIndices.mnnIndex;
    this.noteIndices.durationIndex = _param.noteIndices.durationIndex;
    this.noteIndices.channelIndex = _param.noteIndices.channelIndex;
    this.noteIndices.velocityIndex = _param.noteIndices.velocityIndex;
    this.ccIndices = {};
    if (_param.ccIndices){
      this.ccIndices.ontimeIndex = _param.ccIndices.ontimeIndex;
      this.ccIndices.numberIndex = _param.ccIndices.numberIndex;
      this.ccIndices.channelIndex = _param.ccIndices.channelIndex;
      this.ccIndices.valueIndex = _param.ccIndices.valueIndex;
    }
    this.export();
    // Possible to return something.
    // return sth;
  }
  // Methods for MidiExport object
  MidiExport$1.prototype = {
    constructor: MidiExport$1,

    export: function(){
      const self = this;
      let ontimeCorrection = 0;
      const minOntime = mu$1.min_argmin(
        self.points.map(function(p){ return p[self.ontimeIndex] })
      )[0];
      if (minOntime < 0){
        ontimeCorrection = 4*self.timeSigtopNo/self.timeSigBottomNo;
      }

      // Organise the points and control changes according to their channel numbers.
      const pointsByChan = [];
      const ccByChan = [];
      self.points.forEach(function(p){
        if (pointsByChan[p[self.noteIndices.channelIndex]] === undefined){
          pointsByChan[p[self.noteIndices.channelIndex]] = [p];
        }
        else {
          pointsByChan[p[self.noteIndices.channelIndex]].push(p);
        }
      });
      if (self.controlChanges !== null){
        self.controlChanges.forEach(function(cc){
          if (ccByChan[cc[self.ccIndices.channelIndex]] === undefined){
            ccByChan[cc[self.ccIndices.channelIndex]] = [cc];
          }
          else {
            ccByChan[cc[self.ccIndices.channelIndex]].push(cc);
          }
        });
      }


      let midi = new Midi();
      // "Works" but actually changes nothing!:
      // midi.header.setTempo(240)
      // console.log("midi.header:", midi.header)
      let ntracks = Math.max(pointsByChan.length, ccByChan.length);
      for (let i = 0; i < ntracks; i++){
        const track = midi.addTrack();
        track["channel"] = i;
        if (pointsByChan[i] !== undefined){
          pointsByChan[i].forEach(function(p){
            track.addNote({
              midi: p[self.noteIndices.mnnIndex],
              time: self.scaleFactor*(p[self.noteIndices.ontimeIndex] + ontimeCorrection),
              duration: self.scaleFactor*p[self.noteIndices.durationIndex],
              velocity: p[self.noteIndices.velocityIndex]
            });
          });
        }
        if (ccByChan[i] !== undefined){
          ccByChan[i].forEach(function(cc){
            track.addCC({
              number: cc[self.ccIndices.numberIndex],
              time: self.scaleFactor*(cc[self.ccIndices.ontimeIndex] + ontimeCorrection),
              value: cc[self.ccIndices.valueIndex]
            });
          });
        }
      }
      fs$2.writeFileSync(
        self.fpath,
        new Buffer.from(midi.toArray())
      );
    }


  };

  // Imports
  const fs$1 = require('fs');
  const xmlpstr = require('xml2js').parseString;
  const convert = require('xml-js').xml2js;
  const mu = require('maia-util');

  // Constructor for XmlImport object
  function XmlImport$1(_fpath){
    // Workaround for JS context peculiarities.
    // const self = this;
    this.fpath = _fpath;
    this.data = this.get_data();
    this.compObj = this.xml2json();
    // console.log("this.compObj.notes.slice(0, 10):", this.compObj.notes.slice(0, 10))

    // Npo stands for no preservation of order, and has issues with non-maximal
    // backup values, that can be caused by things like voices ending partway
    // through a bar, and/or cue notes. It is deprecated and will be removed from
    // the constructor in a future release.
    // this.compObjNpo = this.xml2jsonNpo()

    // Possible to return something.
    // return sth;
  }
  // Methods for XmlImport object
  XmlImport$1.prototype = {
    constructor: XmlImport$1,

    get_data: function(){
      return fs$1.readFileSync(this.fpath, "utf8")
    },

    xml2json: function(){
      const self = this;
      const co = {};
      const rawJson = convert(self.data, {compact: false, spaces: 2});
      // Find score partwise.
      const spw = rawJson.elements.find(function(obj){
        return obj.name === "score-partwise"
      });
      // console.log("spw:", spw)
      if (spw === undefined){
        console.log("Could not find score-partwise. Returning early.");
        return
      }

      let credit = [];
      spw.elements.forEach(function(obj){
        if (obj.name === "credit"){
          obj.elements.filter(function(obj){
            return obj.name === "credit-words"
          })
          .forEach(function(obj){
            // console.log("obj:", obj)
            const currJustify = obj.attributes && obj.attributes.justify;
            const currValign = obj.attributes && obj.attributes.valign;
            obj.elements.forEach(function(obj){
              credit.push({
                "justify": currJustify,
                "valign": currValign,
                "text": obj.text.trim()
              });
            });
          });
        }
      });
      // Try to assign name, copyright, composer, lyricist.
      // Put everything else in remarks.
      let name, copyright, composer, lyricist, remark;
      const possNameIdx = credit.findIndex(function(c){
        return c.justify === "center" && c.valign === "top"
      });
      // console.log("possNameIdx:", possNameIdx)
      if (possNameIdx >= 0){
        name = [mu.timelapse_object()];
        name[0].name = credit[possNameIdx].text;
        credit.splice(possNameIdx, 1);
      }
      else { name = []; }
      const possCopyrightIdx = credit.findIndex(function(c){
        return c.text.indexOf("Copyright") >= 0 ||
        c.text.indexOf("copyright") >= 0 ||
        c.text.indexOf("(C)") >= 0 ||
        c.text.indexOf(String.fromCharCode(169)) >= 0
      });
      // console.log("possCopyrightIdx:", possCopyrightIdx)
      if (possCopyrightIdx >= 0){
        copyright = [mu.timelapse_object()];
        copyright[0].displayName = credit[possCopyrightIdx].text;
        credit.splice(possCopyrightIdx, 1);
      }
      else { copyright = []; }
      const possComposerIdx = credit.findIndex(function(c){
        return c.justify === "right" && c.valign === "bottom"
      });
      // console.log("possComposerIdx:", possComposerIdx)
      if (possComposerIdx >= 0){
        composer = [mu.timelapse_object()];
        composer[0].displayName = credit[possComposerIdx].text;
        credit.splice(possComposerIdx, 1);
      }
      else { composer = []; }
      const possLyricistIdx = credit.findIndex(function(c){
        return c.justify === "left" && c.valign === "bottom"
      });
      // console.log("possLyricistIdx:", possLyricistIdx)
      if (possLyricistIdx >= 0){
        lyricist = [mu.timelapse_object()];
        lyricist[0].displayName = credit[possLyricistIdx].text;
        credit.splice(possLyricistIdx, 1);
      }
      else { lyricist = []; }
      remark = credit.map(function(c){
        const r = mu.timelapse_object();
        r.remark = c.text;
        return r
      });
      co.name = name, co.remark = remark, co.copyright = copyright, co.composer = composer, co.lyricist = lyricist;

      // Populate layer.
      let layer = [];
      let staffNo = 0; // Possibly obsolete
      // Find the part list.
      const pl = spw.elements.find(function(obj){
        return obj.name === "part-list"
      });
      // Find the things called part in elements of spw.
      const part = spw.elements.filter(function(obj){
        return obj.name === "part"
      });
      // Find the score part.
      const sp = pl.elements.filter(function(obj){
        return obj.name === "score-part"
      });
      // Use it to define layers.
      sp.forEach(function(obj){
        const currLayer = mu.timelapse_object();
        currLayer.type = "instrument";
        currLayer.vexflow = {};
        currLayer.vexflow.id = obj.attributes.id;
        // console.log("currLayer.vexflow.id:", currLayer.vexflow.id)
        const pn = obj.elements.find(function(obj){
          return obj.name === "part-name"
        });
        if (pn !== undefined && pn.elements !== undefined && pn.elements.length > 0){
          currLayer.vexflow.name = pn.elements[0].text;
          // console.log("currLayer.vexflow.name:", currLayer.vexflow.name)
        }

        // Search for and assign an idInstrument.
        // ...

        // Relevant clefs
        // Note that MusicXML files created by hum2xml have this information
        // stored directly on attributes and not on clef properties of the
        // elements of attributes. So if we work with such files, the code below
        // would need editing to take this into account.
        // Also, at the moment, we assume it's always possible to associate one or
        // more clefs with a part. If we allow for this not to be possible, again
        // the code below would need editing.
        // See xml2jsonNpo for solutions to these implemented previously.
        const relClefs = part.find(function(p){
          return p.attributes.id === obj.attributes.id
        }).elements
        .find(function(obj){
          return obj.name === "measure"
        }).elements
        .find(function(m){
          return m.name === "attributes"
        }).elements
        .filter(function(a){
          return a.name === "clef"
        });
        // console.log("relClefs:", relClefs)
        relClefs.forEach(function(clef, idx){
          currLayer.staffNo = staffNo;
          // console.log("clef.elements:", clef.elements)
          clef.elements.forEach(function(el){
            let propName;
            switch(el.name){
              case "sign":
              propName = "clefSign";
              break
              case "line":
              propName = "clefLine";
              break
              case "clef-octave-change":
              propName = "clefOctaveChange";
              break
              // console.log("Unrecognised clef property.", clef)
            }
            if (propName){
              currLayer.vexflow[propName] = el.elements[0].text;
            }
          });
          currLayer.vexflow.clef = mu.clef_sign_and_line2clef_name(
            currLayer.vexflow.clefSign,
            currLayer.vexflow.clefLine,
            currLayer.vexflow.clefOctaveChange
          );
          layer.push(mu.copy_array_object(currLayer));
          staffNo++;
        });
      });
      // console.log("layer:", layer)

      // Find the parts.
      // Should be one of each of these for the whole piece of music.
      let divisions, anacrusis;
      let keySignatures = [], timeSignatures = [],
      notes = [], ties = [];
      /////
      // Time signatures need more work.
      // Just putting in a default for now.
      ////
      const timeSig = mu.timelapse_object();
      timeSig.barNo = 1, timeSig.topNo = 4, timeSig.bottomNo = 4, timeSig.ontime = 0;
      timeSignatures = [timeSig];

      // Iterate over them to define stuff like notes.
      part.forEach(function(obj, partIdx){
        // Catching an anacrusis and initialising ontime and intOnt are handled as
        // part of case "divisions" below.
        let ontime, intOnt;
        if (anacrusis !== undefined && divisions !== undefined){
          ontime = anacrusis;
          intOnt = Math.round(divisions*anacrusis);
        }

        // Get relevant staffNo. Obsolete?
        // const currStaffNo = layer.find(function(l){
        //   return l.vexflow.id === obj.attributes.id
        // }).staffNo
        // console.log("\ncurrStaffNo:", currStaffNo)

        // Get relevant staffNos.
        const staffNosForId = layer.filter(function(l){
          return l.vexflow.id === obj.attributes.id
        })
        .map(function(l){
          return l.staffNo
        });
        // console.log("staffNosForId:", staffNosForId)
        const measure = obj.elements.filter(function(obj){
          return obj.name === "measure"
        });
        // console.log("measure:", measure)
        measure.forEach(function(obj){
          // Need to do this in order for ontime to be correct.
          const measureNumber = parseInt(obj.attributes.number);
          // console.log("measureNumber:", measureNumber, "ontime:", ontime)
          const elMeasure = obj.elements;
          elMeasure.forEach(function(obj, idx){
            // console.log("Elements of the measure:")
            // console.log(obj)
            let intDur;
            switch(obj.name){
              case "attributes":
              obj.elements.forEach(function(obj2){
                switch(obj2.name){
                  case "divisions":
                  if (divisions !== undefined){
                    console.log("Redefining divisions, which is unusual/not permitted.");
                  }
                  divisions = parseInt(obj2.elements[0].text);
                  // Now that we have a divisions value, we can determine if there
                  // is an anacrusis at the beginning of this piece.
                  const aAndCpb = self.convert_1st_bar2anacrusis_val(
                    elMeasure, divisions
                  );
                  // console.log("aAndCpb:", aAndCpb)
                  anacrusis = aAndCpb[0];
                  // crotchetsPerBar = aAndCpb[1]
                  ontime = anacrusis;
                  if (divisions*anacrusis !== Math.floor(divisions*anacrusis)){
                    console.log("divisions*anacrusis is not an integer, but it should be!");
                  }
                  intOnt = Math.round(divisions*anacrusis);
                  // console.log(
                  //   "divisions:", divisions, "anacrusis:", anacrusis,
                  //   "crotchetsPerBar:", crotchetsPerBar, "ontime:", ontime,
                  //   "intOnt:", intOnt
                  // )

                  break
                  case "key":
                  const currKey = mu.timelapse_object();
    							currKey.barNo = measureNumber + (anacrusis === 0);
                  let possFifths = obj2.elements.find(function(obj){
                    return obj.name === "fifths"
                  });
                  if (possFifths !== undefined){
                    possFifths = parseInt(possFifths.elements[0].text);
                  }
                  currKey.fifths = possFifths || 0;
    							let possMode = obj2.elements.find(function(obj){
                    return obj.name === "mode"
                  });
                  if (possMode !== undefined){
                    possMode = possMode.elements[0].text;
                  }
                  currKey.mode = possMode || 0;
                  currKey.keyName = mu.nos_symbols_and_mode2key_name(
                    currKey.fifths, currKey.mode
                  );

    							// It is important to realise that when a MusicXML file says
    							// fifths, what it means is the number of sharps (positive
    							// integer) or flats (negative integer) in the key signature. So
    							// A minor will have a fifths value of 0, but A is three steps
    							// clockwise from C on the circle of fifths, so this code adjusts
    							// the fifths value of minor keys to reflect this.
                  if (currKey.mode === "minor"){
                    currKey.fifthSteps += 3;
                  }
    							switch(currKey.mode){
    								case "major":
    									currKey.mode = 0;
    									break
    								case "minor":
    									currKey.mode = 5;
    									break
    								case "ionian":
    									currKey.mode = 0;
    									break
    								case "dorian":
    									currKey.mode = 1;
    									break
    								case "phrygian":
    									currKey.mode = 2;
    									break
    								case "lydian":
    									currKey.mode = 3;
    									break
    								case "mixolydian":
    									currKey.mode = 4;
    									break
    								case "aeolian":
    									currKey.mode = 5;
    									break
    								case "locrian":
    									currKey.mode = 6;
    									break
    							}
                  ///////////
                  // MORE WORK REQUIRED HERE.
                  ///////////
    							// currKey.staffNo = []; // Populated in for loop below.
    							// // Get ontime from bar number rather than from the ontime
    							// // variable, because there could still be rounding errors here.
    							// currKey.ontime
    							// 	= mu.ontime_of_bar_and_beat_number(currKey.barNo, 1, time_sig_array);
    							// for (let staffi = 0; staffi < staff_nos_for_this_id.length; staffi++){
    							// 	currKey.staffNo = staff_nos_for_this_id[staffi];
    							// 	key_sig_array.push(currKey);
    							// }
                  keySignatures.push(currKey);
                  break
                  // console.log("Should not get here in switch over measure.elements.", obj.name)
                }
              });
              break
              case "note":
              const currNote = mu.timelapse_object();
              let restTf = false, graceTf = false, cueTf = false, tieArr = [];
              obj.elements.forEach(function(obj){
                switch(obj.name){
                  case "pitch":
                  const xmlPitch = {};
                  obj.elements.forEach(function(obj){
                    xmlPitch[obj.name] = obj.elements[0].text;
                  });
                  // console.log("xmlPitch:", xmlPitch)
                  currNote.pitch = self.xml_pitch2pitch_class_and_octave(xmlPitch);
                  const mnnMpn = mu.pitch_and_octave2midi_note_morphetic_pair(currNote.pitch);
                  currNote.MNN = mnnMpn[0];
                  currNote.MPN = mnnMpn[1];
                  break
                  case "rest":
                  restTf = true;
                  break

                  case "duration":
                  intDur = parseInt(obj.elements[0].text);
                  break
                  case "staff":
                  // console.log("Got to a staff!")
                  // console.log("obj.elements:", obj.elements)

                  break
                  case "voice":
                  // console.log("Got to a voice!")
                  // console.log("obj.elements:", obj.elements)
                  const staffVoiceNos = mu.staff_voice_xml2staff_voice_json(
                    obj.elements[0].text,
                    staffNosForId,
                    partIdx
                  );
                  // console.log("staffVoiceNos:", staffVoiceNos)
                  currNote.staffNo = staffVoiceNos[0];
                  currNote.voiceNo = staffVoiceNos[1];
                  break
                  case "type":

                  break
                  case "time-modification":
                  // This (and perhaps other parts of this converter) need more
                  // work to handle stuff like
                  // <time-modification>
                  //   <actual-notes>3</actual-notes>
                  //   <normal-notes>2</normal-notes>
                  //   <normal-type>16th</normal-type>
                  //   <normal-dot/>
                  //   <normal-dot/>
                  // </time-modification>
                  const timeMod = {};
                  obj.elements.forEach(function(obj){
                    if (
                      obj.elements !== undefined && obj.elements.length > 0 &&
                      obj.elements[0].text !== undefined
                    ){
                      timeMod[obj.name] = obj.elements[0].text;
                    }
                  });
                  currNote.timeMod = timeMod;
                  break
                  case "stem":

                  break
                  case "beam":

                  break
                  case "tie":
                  tieArr.push(obj.attributes);

                  break
                  case "accidental":
                  currNote.accidental = obj.elements[0].text;
                  break
                  case "notations":

                  break
                  default:
                  case "dot":

                  break
                  case "grace":
                  graceTf = true;
                  break
                  case "cue":
                  cueTf = true;
                  break
                  // console.log("Should not get here in switch over note's obj.elements:", obj.name)

                } // Ends switch(obj.name)
              }); // Ends iteration over elements of the note.

              if (!graceTf && !cueTf){
                // Update ontime etc. here.
                let duration = Math.round(intDur/divisions*100000)/100000;
                // This is offtime in crotchet beats rounded to 5 decimal places.
                let offtime = Math.round((intOnt + intDur)/divisions*100000)/100000;
                let barBeat = mu.bar_and_beat_number_of_ontime(ontime, timeSignatures);
                let barOn = barBeat[0];
                let beatOn = Math.round(barBeat[1]*100000)/100000;
                barBeat = mu.bar_and_beat_number_of_ontime(offtime, timeSignatures);
                let barOff = barBeat[0];
                let beatOff = Math.round(barBeat[1]*100000)/100000;

                if (!restTf){
                  currNote.barOn = barOn;
                  currNote.beatOn = beatOn;
                  currNote.ontime = ontime;
                  currNote.duration = duration;
                  currNote.barOff = barOff;
                  currNote.beatOff = beatOff;
                  currNote.offtime = offtime;

                  ////
                  // THIS NEEDS REVISITING!
                  ////
                  // let staff_and_voice_nos
                  //   = mu.staff_voice_xml2staff_voice_json(
                  //     notes[note_index].voice, staff_nos_for_this_id, part_idx);
                  // currNote.staffNo = staff_and_voice_nos[0];
                  // currNote.voiceNo = staff_and_voice_nos[1];

                  // Could add some more properties here, like integer duration
                  // as expressed in the MusicXML file, stem direction, etc. NB,
                  // if there are ties here, properties such as intDur, type,
                  // stem, beam, etc. are not accurate reflections of the summary
                  // oblong properties, and they are removed by resolve_ties.
                  // Lyric.


                  // Once it's established whether a note is part of a tie or not,
                  // we can either push it to notes or to ties.
                  if (tieArr.length === 0){
                    notes.push(currNote);
                  }
                  else {
                    // console.log("tieArr:", tieArr)
                    if (tieArr.length > 1){
                      currNote.tieType = "stop and start";
                    }
                    else {
                      currNote.tieType = tieArr[0].type;
                    }
                    ties.push(currNote);
                  }
                }


                // If the note is the first, second,..., (n - 1)th note of an n-
                // note chord, then do not increment these variables. Wait till
                // the nth note.
                if (
                  idx < elMeasure.length - 1 &&
                  elMeasure[idx + 1].elements !== undefined &&
                  elMeasure[idx + 1].elements.find(function(obj){
                    return obj.name === "chord"
                  })
                );
                else {
                  ontime = offtime;
                  intOnt += intDur;
                  // console.log("restTf:", restTf, "ontime:", ontime, "intOnt:", intOnt)
                }
                // ...
              }

              break

              case "backup":
              // console.log("Got to a backup.")
              intDur = parseInt(obj.elements[0].elements[0].text);
              // console.log("backup amount:", intDur)
              intOnt -= intDur;
              ontime = Math.round(intOnt/divisions*100000)/100000;
              // console.log("intOnt:", intOnt, "ontime:", ontime)
              break

              case "forward":
              // console.log("Got to a forward.")
              intDur = parseInt(obj.elements[0].elements[0].text);
              // console.log("forward amount:", intDur)
              intOnt += intDur;
              ontime = Math.round(intOnt/divisions*100000)/100000;
              // console.log("intOnt:", intOnt, "ontime:", ontime)
              break
              // console.log("Should not get here in switch over measure.elements.", obj.name)
            }
          }); // elMeasure.forEach(function(obj, idx)
        }); // measure.forEach(function(obj)
      }); // part.forEach(function(obj)

      const notesAndTied = notes.concat(
        self.resolve_ties(ties)
      );
      co.notes = notesAndTied.sort(mu.sort_points_asc);
      co.layer = layer;
      co.timeSignatures = timeSignatures;
      co.keySignatures = keySignatures;
      // Append some miscellaneous information.
      if (co.miscImport === undefined){
        co.miscImport = {};
      }
      if (co.miscImport.musicXml === undefined){
        co.miscImport.musicXml = {
          "divisions": divisions, "anacrusis": anacrusis
        };
      }

      return co


  		// Staff and clef names.
  		// Get the staff names, abbreviations, IDs, and initial associated clefs
  		// (for clef changes, see further below). We include initial associated
  		// clefs because often people use these instead of instrument names to
  		// refer to staves.
  		// let staff_and_clef_names = [];
  		// let staff_no = 0;
  		// if (xmlAsJson["score-partwise"]["part-list"]){
  		// 	let part_list = xmlAsJson["score-partwise"]["part-list"];
  		// 	if (part_list[0]["score-part"]){
  		// 		for (let parti = 0; parti < part_list[0]["score-part"].length; parti++){
  		// 			// console.log('score_part:');
  		// 			// console.log(part_list[0]["score-part"][parti]);
  		// 			let curr_staff = {};
  		// 			curr_staff.name = part_list[0]["score-part"][parti]["part-name"][0];
  		// 			if (part_list[0]["score-part"][parti]["part-abbreviation"]){
  		// 				curr_staff.abbreviation
  		// 					= part_list[0]["score-part"][parti]["part-abbreviation"][0];
      //
  		// 			}
  		// 			curr_staff.id = part_list[0]["score-part"][parti].$.id;
  		// 			// Use the ID to find the initial associated clef.
  		// 			curr_staff.clef = "unknown";
  		// 			let target_idx = -1;
  		// 			if (xmlAsJson["score-partwise"]["part"]){
  		// 				let partj = 0;
  		// 				while (partj < xmlAsJson["score-partwise"]["part"].length){
  		// 					if (xmlAsJson["score-partwise"]["part"][partj].$.id == curr_staff.id){
  		// 						target_idx = partj;
  		// 						partj = xmlAsJson["score-partwise"]["part"].length - 1;
  		// 					}
  		// 					partj++;
  		// 				}
  		// 			}
  		// 			// console.log('target_idx:');
  		// 			// console.log(target_idx);
  		// 			if (target_idx >= 0 &&
  		// 					xmlAsJson["score-partwise"]["part"][target_idx] &&
  		// 					xmlAsJson["score-partwise"]["part"][target_idx].measure &&
  		// 					xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes){
  		// 				let curr_attr = xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes;
  		// 				// console.log('curr_attr:');
  		// 				// console.log(curr_attr);
  		// 				// We found the associated part - try to find the associated clef.
  		// 				let clef_attr = xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes[0].clef;
  		// 				// Handle MusicXML files created by hum2xml.
  		// 				if (clef_attr == undefined){
  		// 					let attri = 0;
  		// 					while (attri < curr_attr.length){
  		// 						if (curr_attr[attri].clef){
  		// 							clef_attr = curr_attr[attri].clef;
  		// 							attri = curr_attr.length - 1;
  		// 						}
  		// 						attri++;
  		// 					}
  		// 				}
  		// 				if (clef_attr == undefined){
  		// 					console.log('Could not associate any clefs with part ID: ' +
  		// 											curr_staff.id);
  		// 					console.log('We recommend editing the MusicXML file to ' +
  		// 											'explicity specify clefs for each staff, prior to ' +
  		// 											'upload.');
  		// 					curr_staff.staffNo = staff_no;
  		// 					// console.log('curr_staff:');
  		// 					// console.log(curr_staff);
  		// 					staff_and_clef_names.push(mu.copy_array_object(curr_staff));
  		// 					staff_no = staff_no + 1;
  		// 				}
  		// 				else{
  		// 					// console.log('clef_attr:');
  		// 					// console.log(clef_attr);
  		// 					for (let clefi = 0; clefi < clef_attr.length; clefi++){
  		// 						curr_staff.clefSign = clef_attr[clefi].sign[0];
  		// 						curr_staff.clefLine = parseInt(clef_attr[clefi].line[0]);
  		// 						if (clef_attr[clefi]["clef-octave-change"]){
  		// 							curr_staff.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
  		// 						}
  		// 						curr_staff.clef = mu.clef_sign_and_line2clef_name(curr_staff.clefSign,
  		// 																																curr_staff.clefLine,
  		// 																																curr_staff.clefOctaveChange);
  		// 						curr_staff.staffNo = staff_no;
  		// 						// console.log('curr_staff:');
  		// 						// console.log(curr_staff);
  		// 						staff_and_clef_names.push(mu.copy_array_object(curr_staff));
  		// 						staff_no = staff_no + 1;
  		// 					}
  		// 				}
  		// 			}
  		// 		}
  		// 	}
  		// }
  		// co.staffAndClefNames = staff_and_clef_names;
      //
  		// // Key signatures.
  		// let key_sig_array = [];
  		// co.keySignatures = key_sig_array;
  		// // This is populated in the iteration over measures within each part,
  		// // because different parts can have independent key signatures.
      //
      // // Retrieve all parts in the Music XML file.
      // let part = xmlAsJson['score-partwise'].part;
      //
      // // Focus on the top staff first, to get things like the divisions value
      // // and any time signature changes.
      // let measure = part[0].measure;
      //
      // // Define the divisions value. There should be one of these for the whole
      // // piece of music.
      // let divisions
      // if(measure[0].attributes){
      //   let attributes = measure[0].attributes;
      //   for(let j = 0; j < attributes.length; j++){
      //     if(attributes[j].divisions){
      //       divisions = parseInt(attributes[j].divisions[0]);
      //       console.log('Divisions: ' + divisions);
      //     }
      //   }
      // }
      //
      // // Handle an anacrusis here.
  		// // console.log('bar_1:');
  		// // console.log(measure[0]);
  		// let anacrusis_and_crotchets_per_bar
  		//   = mu.convert_1st_bar2anacrusis_val(measure[0], divisions);
  		// let anacrusis = anacrusis_and_crotchets_per_bar[0];
  		// let crotchets_per_bar = anacrusis_and_crotchets_per_bar[1];
  		// console.log('anacrusis:');
  		// console.log(anacrusis);
  		// console.log('crotchets_per_bar:');
  		// console.log(crotchets_per_bar);
      //
  		// // Time signatures array. We only need to do this for one staff. It should
  		// // apply across all other staves.
      // let time_sig_array = [];
      // for (let measure_index = 0; measure_index < measure.length; measure_index++){
      //   if (measure[measure_index].attributes){
      //     let attributes = measure[measure_index].attributes;
      //     for (let j = 0; j < attributes.length; j++){
      //       if (attributes[j].time){
      //         // Assuming there is only one time per attribute...
      //         let time_sig_curr = {};
      //         time_sig_curr.barNo = measure_index + (anacrusis == 0);
      //         time_sig_curr.topNo = parseInt(attributes[j].time[0].beats[0]);
      //         time_sig_curr.bottomNo = parseInt(attributes[j].time[0]['beat-type'][0]);
      //         console.log('A time signature in bar: ' + time_sig_curr.barNo + ', top number: ' + time_sig_curr.topNo
  		// 										+ ', bottom number: ' + time_sig_curr.bottomNo);
      //         // console.log(attributes[j].time[0].beats[0])+"\n";
      //         time_sig_array.push(time_sig_curr);
      //       }
      //     }
      //   }
      // }
  		// if (anacrusis != 0) {
  		// 	time_sig_array
  		// 	  = mu.append_ontimes_to_time_signatures(
  		// 		  time_sig_array, crotchets_per_bar);
      // }
  		// else {
  		// 	time_sig_array = mu.append_ontimes_to_time_signatures(time_sig_array);
      // }
      // // console.log('Time signatures array: ' + time_sig_array);
      // co.timeSignatures = time_sig_array;
      //
  		// // Tempo changes.
  		// let tempo_changes = [];
  		// co.tempi = tempo_changes;
      //
  		// // Clef changes.
  		// let clef_changes = [];
  		// co.clefChanges = [];
      //
  		// // Sequencing (repeat marks, 1st, 2nd time, da capo, etc.). We only need to
  		// // do this for one staff. It should apply across all other staves.
  		// let sequencing = [];
  		// for (let measure_index = 0; measure_index < measure.length; measure_index++){
  		// 	// Direction to do with barline, or 1st, 2nd-time bars.
      //   if (measure[measure_index].barline){
      //     let barline = measure[measure_index].barline;
      //     for (let j = 0; j < barline.length; j++){
  		// 			// console.log('sequencing command:');
  		// 			// console.log(barline[j].repeat);
  		// 			let curr_sequence = {};
  		// 			curr_sequence.barNo = measure_index + (anacrusis == 0);
  		// 			curr_sequence.type = "barline";
  		// 			if (barline[j].$ && barline[j].$.location){
  		// 				curr_sequence.location = barline[j].$.location;
  		// 			}
  		// 			if (barline[j].ending){
  		// 				curr_sequence.endingNo = barline[j].ending[0].$.number;
  		// 				curr_sequence.endingType = barline[j].ending[0].$.type;
  		// 			}
  		// 			if (barline[j].style){
  		// 				curr_sequence.style = barline[j].style;
  		// 			}
  		// 			if (barline[j].repeat){
  		// 				curr_sequence.repeatDir = barline[j].repeat[0].$.direction;
  		// 			}
  		// 			// console.log('Bar number:');
  		// 			// console.log(curr_sequence.barNo);
  		// 			// console.log('curr_sequence:');
  		// 			// console.log(curr_sequence);
  		// 			curr_sequence.ontime
  		// 			  = mu.ontime_of_bar_and_beat_number(
  		// 					curr_sequence.barNo, 1, time_sig_array);
  		// 			sequencing.push(curr_sequence);
      //     }
      //   }
  		// 	// Direction like dal segno.
  		// 	if (measure[measure_index].direction){
  		// 		let direction = measure[measure_index].direction;
  		// 		for (let j = 0; j < direction.length; j++){
  		// 			if (direction[j]["direction-type"] &&
  		// 					direction[j]["direction-type"][0].words){
  		// 				// console.log('direction:');
  		// 				// console.log(direction[j]);
  		// 				let poss_commands = ["Fine", "D.C.", "D.C. al Fine",
  		// 														 "D.C. al Coda", "D.S. al Coda",
  		// 														 "D.S. al Fine", "D.S.", "To Coda"];
  		// 				let target_idx
  		// 					= poss_commands.indexOf(direction[j]["direction-type"][0].words[0]);
  		// 				// console.log('target_idx:');
  		// 				// console.log(target_idx);
  		// 				if (target_idx >= 0){
  		// 					let curr_sequence = {};
  		// 					curr_sequence.barNo = measure_index + (anacrusis == 0);
  		// 					curr_sequence.type = "command";
      //           if (direction[j].$ !== undefined){
  		// 					  curr_sequence.placement = direction[j].$.placement;
      //           }
  		// 					curr_sequence.words = direction[j]["direction-type"][0].words[0];
  		// 					curr_sequence.ontime
  		// 						= mu.ontime_of_bar_and_beat_number(
  		// 							curr_sequence.barNo, 1, time_sig_array);
  		// 					sequencing.push(curr_sequence);
  		// 				}
  		// 			}
  		// 		}
  		// 	}
      // }
      //
  		// // Define the page layout array object, which contains information relating
  		// // to system breaks, page breaks, system spacers, etc. For page and system
  		// // breaks, current thinking is we only need to do this for one staff,
  		// // because it should apply. Spacers (which put a bit more or less space
  		// // between pairs of staves within or between systems when required) do not
  		// // seem to be exported in the MusicXML file, but if they were, these would
  		// // need identifying across all parts.
  		// let page_layout = {};
  		// let page_breaks = [];
  		// let system_breaks = [];
  		// // let spacers = [];
  		// for (let measure_index = 0; measure_index < measure.length; measure_index++){
      //   if(measure[measure_index].print){
  		// 		// console.log('Print command!');
  		// 		// console.log(measure[measure_index].print);
  		// 		let print_array = measure[measure_index].print;
  		// 		for (let printi = 0; printi < print_array.length; printi++){
  		// 			if (print_array[printi].$ &&
  		// 					print_array[printi].$["new-page"]){
  		// 				page_breaks.push(measure_index + (anacrusis == 0));
  		// 			}
  		// 			if (print_array[printi].$ &&
  		// 					print_array[printi].$["new-system"]){
  		// 				system_breaks.push(measure_index + (anacrusis == 0));
  		// 			}
  		// 		}
  		// 	}
  		// }
  		// if (page_breaks.length == 0 && system_breaks.length == 0){
  		// 	// Insert default page and system breaks.
  		// 	let page_and_system_breaks
  		// 	  = mu.default_page_and_system_breaks(
  		// 			staff_and_clef_names, measure.length);
  		// 	page_breaks = page_and_system_breaks[0];
  		// 	system_breaks = page_and_system_breaks[1];
  		// }
  		// page_layout.pageBreaks = page_breaks;
  		// page_layout.systemBreaks = system_breaks;
      //
      // // Iterate over each part and build up the notes array.
      //
      // // Define the notes array.
      // let notes_array = [];
  		// let noteID = 0;
  		// let tied_array = [];
  		// let grace_array = [];
  		// // Define the rests array. This is not necessary for displaying a freshjam
  		// // project, but the information is present in the MusicXML file (and could
  		// // help us display the traditional staff notation). So in the interests of
  		// // lossless conversion, I'm storing the rest information too.
  		// let rests_array = [];
  		// let restID = 0;
  		// // Define the expressions array. This is not necessary for displaying a
  		// // freshjam project, but the information is present in the MusicXML file
  		// // (and could help us display the traditional staff notation). So in the
  		// // interests of lossless conversion, I'm storing the rest information too.
  		// let xprss_array = [];
  		// let xprssID = 0;
      //
      // for (let part_idx = 0; part_idx < part.length; part_idx++){
      //
      //   console.log('Part: ' + part_idx);
  		// 	let ontime = anacrusis;
  		// 	// Incrementing integer representation of ontime, using divisions.
  		// 	let intOnt = anacrusis*divisions;
  		// 	let part_id = part[part_idx].$.id;
  		// 	// This variable tells you which staff number(s) should be associated
  		// 	// with a particular part. In MusicXML 2.0, keyboard instruments such as
  		// 	// piano or harpsichord will have two staves written within one part.
  		// 	let staff_nos_for_this_id = [];
  		// 	for (let staffi = 0; staffi < staff_and_clef_names.length; staffi++){
  		// 		if (staff_and_clef_names[staffi].id == part_id){
  		// 			staff_nos_for_this_id.push(staff_and_clef_names[staffi].staffNo);
  		// 		}
  		// 	}
  		// 	// console.log('staff_nos_for_this_id:');
  		// 	// console.log(staff_nos_for_this_id);
      //
      //   measure = part[part_idx].measure;
      //   for (let measure_index = 0; measure_index < measure.length; measure_index++){
      //
      //     // console.log('\nMeasure: ' + measure_index);
      //
  		// 		// Key signatures and clef changes.
  		// 		if(measure[measure_index].attributes){
  		// 			let attributes = measure[measure_index].attributes;
  		// 			// console.log('attributes:');
  		// 			// console.log(attributes);
  		// 			for(let j = 0; j < attributes.length; j++){
  		// 				// Key signatures.
  		// 				if(attributes[j].key){
  		// 					// console.log('key:');
  		// 					// console.log(attributes[j].key);
  		// 					let curr_key = {};
  		// 					curr_key.barNo = measure_index + (anacrusis == 0);
  		// 					if (attributes[j].key[0].mode == undefined){
  		// 						attributes[j].key[0].mode = ['major'];
  		// 					}
  		// 					curr_key.keyName
  		// 					= mu.nos_symbols_and_mode2key_name(attributes[j].key[0].fifths[0],
  		// 																							 attributes[j].key[0].mode[0]);
      //
  		// 					// It is important to realise that when a MusicXML file says
  		// 					// fifths, what it means is the number of sharps (positive
  		// 					// integer) or flats (negative integer) in the key signature. So
  		// 					// A minor will have a fifths value of 0, but A is three steps
  		// 					// clockwise from C on the circle of fifths, so this code adjusts
  		// 					// the fifths value of minor keys to reflect this.
  		// 					switch(attributes[j].key[0].mode[0]){
  		// 						case 'minor':
  		// 							curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]) + 3;
  		// 							break;
  		// 						default:
  		// 							curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]);
  		// 							break;
  		// 					}
  		// 					switch(attributes[j].key[0].mode[0]){
  		// 						case 'major':
  		// 							curr_key.mode = 0;
  		// 							break;
  		// 						case 'minor':
  		// 							curr_key.mode = 5;
  		// 							break;
  		// 						case 'ionian':
  		// 							curr_key.mode = 0;
  		// 							break;
  		// 						case 'dorian':
  		// 							curr_key.mode = 1;
  		// 							break;
  		// 						case 'phrygian':
  		// 							curr_key.mode = 2;
  		// 							break;
  		// 						case 'lydian':
  		// 							curr_key.mode = 3;
  		// 							break;
  		// 						case 'mixolydian':
  		// 							curr_key.mode = 4;
  		// 							break;
  		// 						case 'aeolian':
  		// 							curr_key.mode = 5;
  		// 							break;
  		// 						case 'locrian':
  		// 							curr_key.mode = 6;
  		// 							break;
  		// 					}
  		// 					curr_key.staffNo = []; // Populated in for loop below.
  		// 					// Get ontime from bar number rather than from the ontime
  		// 					// variable, because there could still be rounding errors here.
  		// 					curr_key.ontime
  		// 						= mu.ontime_of_bar_and_beat_number(curr_key.barNo, 1, time_sig_array);
  		// 					for (let staffi = 0; staffi < staff_nos_for_this_id.length; staffi++){
  		// 						curr_key.staffNo = staff_nos_for_this_id[staffi];
  		// 						key_sig_array.push(mu.copy_array_object(curr_key));
  		// 					}
  		// 				}
      //
  		// 				// Clef changes.
  		// 				if(attributes[j].clef){
  		// 					let clef_attr = attributes[j].clef;
  		// 					// console.log('clef in measure ' + measure_index + ':');
  		// 					// console.log(clef_attr);
  		// 					let curr_clef = {};
  		// 					curr_clef.barNo = measure_index + (anacrusis == 0);
  		// 					// Get ontime from bar number rather than from the ontime
  		// 					// variable, because there could still be rounding errors here.
  		// 					curr_clef.ontime
  		// 						= mu.ontime_of_bar_and_beat_number(curr_clef.barNo, 1, time_sig_array);
  		// 					curr_clef.clef = "unknown"; // Populated below.
  		// 					for (let clefi = 0; clefi < clef_attr.length; clefi++){
  		// 						curr_clef.clefSign = clef_attr[clefi].sign[0];
  		// 						curr_clef.clefLine = parseInt(clef_attr[clefi].line[0]);
  		// 						if (clef_attr[clefi]["clef-octave-change"]){
  		// 							curr_clef.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
  		// 						}
  		// 						curr_clef.clef = mu.clef_sign_and_line2clef_name(curr_clef.clefSign,
  		// 																																curr_clef.clefLine,
  		// 																																curr_clef.clefOctaveChange);
  		// 						if (clef_attr[clefi].$ && clef_attr[clefi].$.number){
  		// 							// console.log('clef number:');
  		// 							// console.log(clef_attr[clefi].$.number);
  		// 							curr_clef.staffNo
  		// 							  = staff_nos_for_this_id[parseInt(clef_attr[clefi].$.number[0]) - 1];
  		// 						}
  		// 						else{
  		// 							curr_clef.staffNo = staff_nos_for_this_id[0];
  		// 						}
  		// 						// curr_clef.staffNo = staff_no;
  		// 						// console.log('curr_staff:');
  		// 						// console.log(curr_staff);
  		// 						clef_changes.push(mu.copy_array_object(curr_clef));
  		// 						// staff_no = staff_no + 1;
  		// 					}
  		// 				}
  		// 			}
  		// 		}
      //
  		// 		// Tempo changes and expressions.
  		// 		if (measure[measure_index].direction){
  		// 			let direction = measure[measure_index].direction;
  		// 			for (let j = 0; j < direction.length; j++){
  		// 				// Tempo change.
  		// 				if (direction[j].sound &&
  		// 						direction[j].sound[0].$ &&
  		// 						direction[j].sound[0].$.tempo){
  		// 					let curr_tempo = {};
  		// 					// Timing will need updating to be more precise.
  		// 					curr_tempo.barOn = measure_index + (anacrusis == 0);
  		// 					curr_tempo.beatOn = 1;
  		// 					curr_tempo.ontime
  		// 					  = mu.ontime_of_bar_and_beat_number(
  		// 							curr_tempo.barOn, 1, time_sig_array);
  		// 					curr_tempo.bpm = parseFloat(direction[j].sound[0].$.tempo);
  		// 					// console.log('direction-type:');
  		// 					// console.log(direction[j]["direction-type"]);
  		// 					if (direction[j]["direction-type"] &&
  		// 							direction[j]["direction-type"][0].words){
  		// 						curr_tempo.tempo = direction[j]["direction-type"][0].words[0];
  		// 					}
  		// 					if (mu.array_object_index_of(
  		// 								tempo_changes, curr_tempo.ontime, "ontime") == -1){
  		// 						// Some MusicXML files contain duplicate tempo instructions.
  		// 						// The check above will not allow tempo instructions with the
  		// 						// same ontime as an existing tempo instruction to be inserted
  		// 						// in the tempo_changes array.
  		// 						tempo_changes.push(curr_tempo);
  		// 					}
  		// 				}
  		// 				// Expression - dynamic.
  		// 				if (direction[j]["direction-type"] &&
  		// 						direction[j]["direction-type"][0].dynamics){
  		// 					let curr_xprss = {};
  		// 					curr_xprss.ID = xprssID.toString();
  		// 					// Timing will need updating to be more precise.
  		// 					curr_xprss.barOn = measure_index + (anacrusis == 0);
  		// 					curr_xprss.beatOn = 1;
  		// 					curr_xprss.ontime
  		// 					  = mu.ontime_of_bar_and_beat_number(
  		// 							curr_xprss.barOn, 1, time_sig_array);
  		// 					for (let key in direction[j]["direction-type"][0].dynamics[0]){
  		// 						// This is not really a loop because there is probably only one
  		// 						// key.
  		// 						curr_xprss.type = { "dynamics": key };
      //             if (direction[j].$ !== undefined){
      //               curr_xprss.placement = direction[j].$.placement;
      //             }
  		// 						if (direction[j].staff){
  		// 							curr_xprss.staffNo
  		// 							  = staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
  		// 						}
  		// 						else{
  		// 							curr_xprss.staffNo = staff_nos_for_this_id[0];
  		// 						}
  		// 						xprss_array.push(curr_xprss);
  		// 						xprssID++;
  		// 					}
  		// 				}
  		// 				// Expression - wedge.
  		// 				if (direction[j]["direction-type"] &&
  		// 						direction[j]["direction-type"][0].wedge){
  		// 					let curr_xprss = {};
  		// 					curr_xprss.ID = xprssID.toString();
  		// 					// Timing will need updating to be more precise.
  		// 					curr_xprss.barOn = measure_index + (anacrusis == 0);
  		// 					curr_xprss.beatOn = 1;
  		// 					curr_xprss.ontime
  		// 					  = mu.ontime_of_bar_and_beat_number(
  		// 							curr_xprss.barOn, 1, time_sig_array);
  		// 					// console.log('wedge:');
  		// 					// console.log(direction[j]["direction-type"][0].wedge[0]);
  		// 					curr_xprss.type = { "wedge": direction[j]["direction-type"][0].wedge[0].$.type };
      //           if (direction[j].$ !== undefined){
      //             curr_xprss.placement = direction[j].$.placement;
      //           }
  		// 					if (direction[j].staff){
  		// 							curr_xprss.staffNo
  		// 							= staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
  		// 					}
  		// 					else{
  		// 						curr_xprss.staffNo = staff_nos_for_this_id[0];
  		// 					}
  		// 					xprss_array.push(curr_xprss);
  		// 					xprssID++;
  		// 				}
  		// 			}
  		// 		}
      //
  		// 		// Grab the number of backups, which are used to encode multiple voices
      //     // in one measure on one staff.
      //     let backups, time_at_end_of_this_bar
      //     if (measure[measure_index].backup){
      //       backups = measure[measure_index].backup;
      //       // Filter out any backup values that are not equal to the maximum
      //       // backup value. A POTENTIALLY DANGEROUS STRATEGY, but need a way to
      //       // take account of backups that are associated with cue notes and so
      //       // do not advance voiceNo in the usual way.
      //       const maxBackup = mu.max_argmax(backups.map(function(b){
      //         return b.duration[0]
      //       }))[0]
      //       const fullBarBackups = []
      //       const partBarBackups = []
      //       backups.forEach(function(b){
      //         if (b.duration[0] === maxBackup){
      //           fullBarBackups.push(b)
      //         }
      //         else {
      //           partBarBackups.push(b)
      //         }
      //       })
      //       backups = fullBarBackups
      //
      //       // console.log('Backup: ' + backups);
      //       time_at_end_of_this_bar =
  		// 			  mu.ontime_of_bar_and_beat_number(
  		// 				  measure_index + (anacrusis == 0) + 1, 1, time_sig_array);
      //       // console.log('Time at end of bar: ' + time_at_end_of_this_bar);
      //     }
      //
      //     if (measure[measure_index].note){
      //       let notes = measure[measure_index].note;
      //       // console.log('notes:', notes)
      //
      //       let voiceNo = 0; // Increment this with appearances of backup.
      //       for (let note_index = 0; note_index < notes.length; note_index++){
      //
      //         // console.log('Note index: ' + note_index);
      //         let note_curr = {};
      //         let rest = 0; // Detect if it is a rest instead of a note.
  		// 				let rest_curr = {};
      //
      //         if (
      //           notes[note_index].grace === undefined &&
      //           notes[note_index].cue === undefined
      //         ){
      //           // Handle pitch information.
      //           // console.log("notes[note_index].pitch:", notes[note_index].pitch)
      //           if (notes[note_index].pitch){
      //             // console.log("INSIDE!")
      //             // console.log("notes[note_index].pitch[0]:", notes[note_index].pitch[0])
  		// 						let final_pitch =
  		// 							self.xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0]);
      //             // console.log("final_pitch:", final_pitch)
      //             if (final_pitch == undefined){
      //               console.log("notes[note_index].pitch[0]:", notes[note_index].pitch[0])
      //               console.log("final_pitch:", final_pitch)
      //             }
  		// 						let MNN_MPN = mu.pitch_and_octave2midi_note_morphetic_pair(final_pitch);
      //             // Populate note_curr properties.
  		// 						note_curr.ID = noteID.toString();
  		// 						// console.log('NoteID: ' + note_curr.ID);
  		// 						noteID++;
      //             note_curr.pitch = final_pitch;
      //             note_curr.MNN = MNN_MPN[0];
      //             note_curr.MPN = MNN_MPN[1];
  		// 						// console.log('Pitch: ' + final_pitch + ', MNN: ' + MNN_MPN[0] + ', MPN: ' + MNN_MPN[1]);
      //           }
      //           else { // Rest.
      //             rest = 1;
  		// 						rest_curr.ID = restID.toString();
  		// 						restID++;
      //           }
      //
  		// 					// Handle timing information.
  		// 					// Begin with the integer duration expressed in MusicXML divisions.
  		// 					let intDur = parseInt(notes[note_index].duration[0]);
      //           // This is duration in crotchet beats rounded to 5 decimal places.
      //           let duration = Math.round(intDur/divisions*100000)/100000;
  		// 					// This is offtime in crotchet beats rounded to 5 decimal places.
  		// 					let offtime = Math.round((intOnt + intDur)/divisions*100000)/100000;
      //
  		// 					let bar_beat = mu.bar_and_beat_number_of_ontime(ontime, time_sig_array);
      //           let barOn = bar_beat[0];
      //           let beatOn = Math.round(bar_beat[1]*100000)/100000;
      //           bar_beat = mu.bar_and_beat_number_of_ontime(offtime, time_sig_array);
      //           let barOff = bar_beat[0];
      //           let beatOff = Math.round(bar_beat[1]*100000)/100000;
      //
  		// 					// Legacy version in operation from November 2014 to August 2015
  		// 					// that did not handle tuplets properly (led to rounding errors).
  		// 					//if (notes[note_index]['time-modification']){
  		// 					//	// Some kind of tuplet, but actually I think duration calculation does not change.
  		// 					//	// This is duration in crotchet beats rounded to 5 decimal places.
  		// 					//	let duration = Math.round(intDur/divisions*100000)/100000;
  		// 					//	//let dur_unround = intDur/divisions;
  		// 					//	//let duration = Math.round(dur_unround
  		// 					//	//                          *notes[note_index]['time-modification'][0]['normal-notes'][0]
  		// 					//	//                          /notes[note_index]['time-modification'][0]['actual-notes'][0]
  		// 					//	//                          *100000)/100000;
  		// 					//}
  		// 					//else {
  		// 					//	// This is duration in crotchet beats rounded to 5 decimal places.
  		// 					//	let duration = Math.round(intDur/divisions*100000)/100000;
  		// 					//}
  		// 					//// Correct rounding errors in the ontime values.
  		// 					//let onDiscrep = Math.ceil(ontime) - ontime;
  		// 					//if (onDiscrep < .00002){
  		// 					//	ontime = Math.ceil(ontime);
  		// 					//}
  		// 					//let offtime = Math.round((ontime + duration)*100000)/100000;
  		// 					//// Correct rounding errors in the offtime values.
  		// 					//let offDiscrep = Math.ceil(offtime) - offtime;
  		// 					//if (offDiscrep < .00002){
  		// 					//	offtime = Math.ceil(offtime);
  		// 					//}
      //
  		// 					// Useful debug for checking rounding errors.
  		// 					//if (note_curr.ID == '666') {
  		// 					//	let testSum = Math.round((ontime + intDur/divisions)*100000)/100000;
  		// 					//	console.log('barOn: ' + barOn);
  		// 					//	console.log('beatOn: ' + beatOn);
  		// 					//	console.log('divisions: ' + divisions);
  		// 					//	console.log('intDur: ' + intDur);
  		// 					//	console.log('ontime: ' + ontime);
  		// 					//	// console.log('onDiscrep: ' + onDiscrep);
  		// 					//	console.log('offtime: ' + offtime);
  		// 					//	// console.log('offDiscrep: ' + offDiscrep);
  		// 					//	console.log('testSum: ' + testSum);
  		// 					//	console.log('intOnt: ' + intOnt);
  		// 					//}
      //
      //           // Populate note_curr properties or rest_curr properties.
  		// 					if (rest == 0){
  		// 						note_curr.barOn = barOn;
  		// 						note_curr.beatOn = beatOn;
  		// 						note_curr.ontime = ontime;
  		// 						note_curr.duration = duration;
  		// 						note_curr.barOff = barOff;
  		// 						note_curr.beatOff = beatOff;
  		// 						note_curr.offtime = offtime;
  		// 						let staff_and_voice_nos
  		// 						  = mu.staff_voice_xml2staff_voice_json(
  		// 								notes[note_index].voice, staff_nos_for_this_id, part_idx);
  		// 						note_curr.staffNo = staff_and_voice_nos[0];
  		// 						note_curr.voiceNo = staff_and_voice_nos[1];
  		// 						// Could add some more properties here, like integer duration
  		// 						// as expressed in the MusicXML file, stem direction, etc. NB,
  		// 						// if there are ties here, properties such as intDur, type,
  		// 						// stem, beam, etc. are not accurate reflections of the summary
  		// 						// oblong properties, and they are removed by resolve_ties.
  		// 						// Lyric.
  		// 						if (notes[note_index].lyric){
  		// 							let lyric_arr = notes[note_index].lyric;
  		// 							let lyric = [];
  		// 							for (let ily = 0; ily < lyric_arr.length; ily++){
  		// 								let lyric_curr = {};
  		// 								lyric_curr.number = parseInt(lyric_arr[ily].$.number);
  		// 								// console.log('lyric_arr[ily].text[0]._:');
  		// 								// console.log(lyric_arr[ily].text[0]._);
  		// 								lyric_curr.syllabic = lyric_arr[ily].syllabic[0];
      //                 if (lyric_arr[ily].text[0]._ == undefined){
      //                   lyric_curr.text = lyric_arr[ily].text[0];
      //                 }
      //                 else {
      //                   lyric_curr.text = lyric_arr[ily].text[0]._;
      //                 }
  		// 								if (lyric_arr[ily].text[0].$ !== undefined &&
      //                     lyric_arr[ily].text[0].$["font-family"] !== undefined){
      //                   lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-family"];
      //                 }
      //                 if (lyric_arr[ily].text[0].$ !== undefined &&
      //                     lyric_arr[ily].text[0].$["font-size"] !== undefined){
      //                   lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-size"];
      //                 }
      //                 if (lyric_arr[ily].text[0].$ !== undefined &&
      //                     lyric_arr[ily].text[0].$["font-style"] !== undefined){
      //                   lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-style"];
      //                 }
  		// 								lyric.push(lyric_curr);
  		// 							}
  		// 							note_curr.lyric = lyric;
  		// 						}
  		// 						// Integer duration.
  		// 						note_curr.intDur = intDur;
  		// 						// Accidental.
  		// 						if (notes[note_index].accidental){
  		// 							// Written accidentals like natural, sharp, flat, etc.
  		// 							note_curr.accidental = notes[note_index].accidental[0];
  		// 						}
  		// 						// Type.
  		// 						if (notes[note_index].type){
  		// 							// Things like quarter note, eighth note, etc.
  		// 							note_curr.type = notes[note_index].type[0];
  		// 						}
  		// 						// Tuplets.
  		// 						if (notes[note_index]['time-modification']){
  		// 							note_curr.timeMod = {
  		// 								"actualNotes":
  		// 								notes[note_index]['time-modification'][0]['actual-notes'][0],
  		// 								"normalNotes":
  		// 								notes[note_index]['time-modification'][0]['normal-notes'][0]
  		// 							};
  		// 						}
  		// 						// Stems.
  		// 						if (notes[note_index].stem){
  		// 							note_curr.stem = notes[note_index].stem[0];
  		// 						}
  		// 						// Beams.
  		// 						if (notes[note_index].beam){
  		// 							let beams = [];
  		// 							for (let ibeam = 0; ibeam < notes[note_index].beam.length; ibeam++){
  		// 								let beam_curr = {};
  		// 								beam_curr.number = parseInt(notes[note_index].beam[ibeam].$.number);
  		// 								if (notes[note_index].beam[ibeam].$.accel){
  		// 									beam_curr.accel = notes[note_index].beam[ibeam].$.accel;
  		// 								}
  		// 								beam_curr.type = notes[note_index].beam[ibeam]._;
  		// 								beams.push(beam_curr);
  		// 							}
  		// 							note_curr.beam = beams;
  		// 						}
  		// 						// Notations.
  		// 						if (notes[note_index].notations){
  		// 							let notations = {};
  		// 							// Articulations.
      //               let articulations
  		// 							if (notes[note_index].notations[0].articulations){
  		// 								let artic_arr = notes[note_index].notations[0].articulations[0];
  		// 								// console.log('articulations:');
  		// 								// console.log(artic_arr);
  		// 								articulations = {};
  		// 								for (let key in artic_arr){
  		// 									articulations[key] = {};
      //                   // articulations.push(key);
  		// 								}
  		// 								notations.articulations = articulations;
  		// 							}
      //               // Include fermata in articulations also.
  		// 							if (notes[note_index].notations[0].fermata){
      //                 if (articulations == undefined){
      //                   // console.log('We got here with artics.');
      //                   articulations = {};
      //                 }
  		// 								let fermata_arr = notes[note_index].notations[0].fermata;
      //                 for (let iferm = 0; iferm < fermata_arr.length; iferm++){
      //                   if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'upright'){
      //                     articulations.fermataUpright = {};
      //                   }
      //                   if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'inverted'){
      //                     articulations.fermataInverted = {};
      //                   }
      //                   if (fermata_arr[iferm].$ === undefined && fermata_arr[iferm] === 'square') {
      //                     articulations.fermataSquare = {};
      //                   }
  		// 								}
      //                 if (notations.articulations == undefined){
      //                   notations.articulations = articulations;
      //                   // console.log('We got here with notations.articulations');
      //                   // console.log(notations.articulations);
      //                 }
  		// 								//let fermata = [];
  		// 								//for (iferm = 0; iferm < fermata_arr.length; iferm++){
  		// 								//	fermata.push(fermata_arr[iferm].$.type);
  		// 								//}
  		// 								//notations.fermata = fermata;
  		// 							}
  		// 							// Ornaments.
  		// 							if (notes[note_index].notations[0].ornaments){
  		// 								let ornam_arr = notes[note_index].notations[0].ornaments[0];
  		// 								let ornaments = [];
  		// 								for (let key in ornam_arr){
  		// 									ornaments.push(key);
  		// 								}
  		// 								notations.ornaments = ornaments;
  		// 							}
  		// 							// Slurs.
  		// 							if (notes[note_index].notations[0].slur){
  		// 								let slur_arr = notes[note_index].notations[0].slur;
  		// 								// console.log('slur:');
  		// 								// console.log(slur_arr);
  		// 								let slur = [];
  		// 								for (let islur = 0; islur < slur_arr.length; islur++){
  		// 									let slur_curr = {};
  		// 									slur_curr.number = parseInt(slur_arr[islur].$.number);
  		// 									slur_curr.type = slur_arr[islur].$.type;
  		// 									slur.push(slur_curr);
  		// 								}
  		// 								notations.slur = slur;
  		// 							}
  		// 							// Technical.
  		// 							if (notes[note_index].notations[0].technical){
  		// 								let techn_arr = notes[note_index].notations[0].technical[0];
  		// 								let technical = [];
  		// 								for (let key in techn_arr){
  		// 									technical.push(key);
  		// 								}
  		// 								notations.technical = technical;
  		// 							}
  		// 							// Tuplet.
  		// 							if (notes[note_index].notations[0].tuplet){
  		// 								let tuplet = notes[note_index].notations[0].tuplet[0];
  		// 								let tupl_curr = {};
  		// 								tupl_curr.type = tuplet.$.type;
  		// 								if (tuplet.$.bracket){
  		// 									tupl_curr.bracket = tuplet.$.bracket;
  		// 								}
      //                 if (tuplet.$["show-number"]){
      //                   tupl_curr.showNumber = tuplet.$["show-number"];
      //                 }
  		// 								notations.tuplet = tupl_curr;
  		// 							}
      //
  		// 							// Assign the notations field to note_curr.
  		// 							note_curr.notations = notations;
  		// 						}
      //
  		// 						if (!notes[note_index].tie){ // there is no tie element
  		// 							// Ordinary untied note. Push it to the notes array.
  		// 							notes_array.push(note_curr);
  		// 						}
  		// 						else { // there is a tie element
      //
      //               // you can access attributes using a dollar sign like so:
  		// 							// console.log(notes[note_index].tie[0].$.type)
  		// 							let tie = note_curr.tieType = notes[note_index].tie;
  		// 							if (tie.length > 1) {
  		// 								note_curr.tieType = 'stop and start';
  		// 							}
  		// 							else {
  		// 								note_curr.tieType = tie[0].$.type;
  		// 							}
  		// 							// console.log(note_curr.tieType);
      //
      //               // Tied note. Push it to the tied notes array for resolving
      //               // below.
      //               tied_array.push(note_curr);
  		// 						}
  		// 					}
  		// 					else {
  		// 						rest_curr.barOn = barOn;
  		// 						rest_curr.beatOn = beatOn;
  		// 						rest_curr.ontime = ontime;
  		// 						rest_curr.duration = duration;
  		// 						rest_curr.barOff = barOff;
  		// 						rest_curr.beatOff = beatOff;
  		// 						rest_curr.offtime = offtime;
  		// 						let staff_and_voice_nos
  		// 						  = mu.staff_voice_xml2staff_voice_json(
  		// 								notes[note_index].voice, staff_nos_for_this_id, part_idx);
  		// 						rest_curr.staffNo = staff_and_voice_nos[0];
  		// 						rest_curr.voiceNo = staff_and_voice_nos[1];
  		// 						// Could add some more properties here, like integer duration
  		// 						// as expressed in the MusicXML, etc.
  		// 						rest_curr.intDur = intDur;
  		// 						// Type.
      //             if (notes[note_index].type){
  		// 							rest_curr.type = notes[note_index].type[0];
  		// 						}
      //             // Tuplets.
      //             if (notes[note_index]['time-modification']){
  		// 							rest_curr.timeMod = {
  		// 								"actualNotes":
  		// 								notes[note_index]['time-modification'][0]['actual-notes'][0],
  		// 								"normalNotes":
  		// 								notes[note_index]['time-modification'][0]['normal-notes'][0]
  		// 							};
  		// 						}
      //             // Notations.
  		// 						if (notes[note_index].notations){
  		// 							let notations = {};
  		// 							// Articulations.
      //               let articulations
  		// 							if (notes[note_index].notations[0].articulations){
  		// 								let artic_arr = notes[note_index].notations[0].articulations[0];
  		// 								// console.log('articulations:');
  		// 								// console.log(artic_arr);
  		// 								articulations = {};
  		// 								for (let key in artic_arr){
  		// 									articulations[key] = {};
      //                   // articulations.push(key);
  		// 								}
  		// 								notations.articulations = articulations;
  		// 							}
      //               // Include fermata in articulations also.
  		// 							if (notes[note_index].notations[0].fermata){
      //                 if (articulations == undefined){
      //                   // console.log('We got here with artics.');
      //                   articulations = {};
      //                 }
  		// 								let fermata_arr = notes[note_index].notations[0].fermata;
      //                 for (let iferm = 0; iferm < fermata_arr.length; iferm++){
      //                   if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'upright'){
      //                     articulations.fermataUpright = {};
      //                   }
      //                   if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'inverted'){
      //                     articulations.fermataInverted = {};
      //                   }
      //                   if (fermata_arr[iferm].$ === undefined && fermata_arr[iferm] === 'square') {
      //                     articulations.fermataSquare = {};
      //                   }
  		// 								}
      //                 if (notations.articulations == undefined){
      //                   notations.articulations = articulations;
      //                 }
  		// 							}
  		// 							// Ornaments.
      //               // Omitted.
      //
  		// 							// Slurs.
      //               // Omitted.
      //
  		// 							// Technical.
  		// 							// Omitted.
      //
  		// 							// Tuplet.
  		// 							if (notes[note_index].notations[0].tuplet){
  		// 								let tuplet = notes[note_index].notations[0].tuplet[0];
  		// 								let tupl_curr = {};
  		// 								tupl_curr.type = tuplet.$.type;
  		// 								if (tuplet.$.bracket){
  		// 									tupl_curr.bracket = tuplet.$.bracket;
  		// 								}
      //                 if (tuplet.$["show-number"]){
      //                   tupl_curr.showNumber = tuplet.$["show-number"];
      //                 }
  		// 								notations.tuplet = tupl_curr;
  		// 							}
      //
  		// 							// Assign the notations field to rest_curr.
  		// 							rest_curr.notations = notations;
  		// 						}
  		// 						rests_array.push(rest_curr);
  		// 					}
      //
      //           // If the note is a second, third, etc. note of a chord, then do
      //           // not increment the ontime variable.
      //           if (note_index < notes.length - 1 && notes[note_index + 1].chord){
      //           }
      //           else { // Do increment the ontime value.
      //             ontime = offtime;
  		// 						intOnt = intOnt + intDur;
      //           }
      //
      //           // Check whether we should switch to define notes in the next voice.
      //           // If so, we will need to subtract the backup value from the running
      //           // ontime.
      //           if (
      //             backups !== undefined &&
      //             time_at_end_of_this_bar !== undefined
      //           ){
      //             if (
      //               ontime == time_at_end_of_this_bar &&
      //               voiceNo < backups.length
      //             ){
      //               const dur_to_subtract = Math.round(parseInt(backups[voiceNo].duration[0])/divisions
      //                                            *100000)/100000;
      //               // console.log('We got here!');
      //               // console.log('With ontime:');
      //               // console.log(ontime);
      //               // console.log('And ontime at end of bar:');
      //               // console.log(time_at_end_of_this_bar);
      //               ontime = ontime - dur_to_subtract;
  		// 							intOnt = intOnt - parseInt(backups[voiceNo].duration[0]);
      //               voiceNo++;
      //             }
      //           }
      //         }
  		// 				else if (notes[note_index].cue === undefined){
      //           // Handle grace notes here. NB grace notes have no duration.
      //           let grace_curr
  		// 					if (notes[note_index].pitch){
  		// 						// Grace notes must, by definition, have a pitch? I'm leaving
  		// 						// the check in here just in case.
  		// 						let final_pitch =
  		// 							self.xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0]);
  		// 						let MNN_MPN = mu.pitch_and_octave2midi_note_morphetic_pair(final_pitch);
      //             // Populate grace_curr properties.
  		// 						grace_curr = {};
  		// 						grace_curr.ID = noteID.toString();
  		// 						noteID++;
  		// 						// console.log('grace:');
  		// 						// console.log(notes[note_index].grace);
  		// 						if (notes[note_index].grace[0].$ != undefined){
  		// 							grace_curr.slash = notes[note_index].grace[0].$.slash;
  		// 						}
      //             grace_curr.pitch = final_pitch;
      //             grace_curr.MNN = MNN_MPN[0];
      //             grace_curr.MPN = MNN_MPN[1];
  		// 						let staff_and_voice_nos
  		// 						  = mu.staff_voice_xml2staff_voice_json(
  		// 								notes[note_index].voice, staff_nos_for_this_id, part_idx);
  		// 						grace_curr.staffNo = staff_and_voice_nos[0];
  		// 						grace_curr.voiceNo = staff_and_voice_nos[1];
  		// 						// Accidental.
  		// 						if (notes[note_index].accidental){
  		// 							// Written accidentals like natural, sharp, flat, etc.
  		// 							grace_curr.accidental = notes[note_index].accidental[0];
  		// 						}
  		// 						// Type.
  		// 						if (notes[note_index].type){
  		// 							// Things like quarter note, eighth note, etc.
  		// 							grace_curr.type = notes[note_index].type[0];
  		// 						}
  		// 					}
  		// 					// Could add more here (e.g., about stems and beams).
      //
  		// 					// Notations.
  		// 					if (notes[note_index].notations){
  		// 						let notations = {};
  		// 						// Slurs.
  		// 						if (notes[note_index].notations[0].slur){
  		// 							let slur_arr = notes[note_index].notations[0].slur;
  		// 							// console.log('slur:');
  		// 							// console.log(slur_arr);
  		// 							let slur = [];
  		// 							for (let islur = 0; islur < slur_arr.length; islur++){
  		// 								let slur_curr = {};
  		// 								slur_curr.number = parseInt(slur_arr[islur].$.number);
  		// 								slur_curr.type = slur_arr[islur].$.type;
  		// 								slur.push(slur_curr);
  		// 							}
  		// 							notations.slur = slur;
  		// 						}
      //
  		// 						// Assign the notations field to grace_curr.
  		// 						grace_curr.notations = notations;
  		// 					}
      //
      //           if (grace_curr !== undefined){
      //             grace_array.push(grace_curr)
      //           }
  		// 				}
      //         else {
      //           // Cue note. Not dealing with these at present.
      //           // ...
      //         }
      //       }
      //     }
      //   }
      // } // part
  		// // Associate grace notes with the appropriate ordinary notes.
  		// let notes_and_tied = self.assoc_grace(notes_array, tied_array, grace_array);
  		// notes_array = notes_and_tied[0];
  		// tied_array = notes_and_tied[1];
      //
  		// // Resolve ties and concatenate them with ordinary notes.
  		// notes_and_tied = notes_array.concat(
  		// 	self.resolve_ties(tied_array.sort(mu.sort_points_asc)));
  		// co.notes = notes_and_tied.sort(mu.sort_points_asc);
      //
  		// // co.notes = notes_array.sort(mu.sort_points_asc);
  		// // co.ties = tied_array.sort(mu.sort_points_asc);
  		// co.rests = rests_array.sort(mu.sort_points_asc);
  		// // co.grace = grace_array;
  		// // Include a default tempo if tempo_changes is empty or if no tempo is
  		// // specified at the beginning of the piece.
  		// if (tempo_changes.length == 0 || tempo_changes[0].ontime > 0){
  		// 	if (anacrusis == 0){
  		// 		tempo_changes.unshift({
  		// 			"barOn": 1, "beatOn": 1, "ontime": 0, "bpm": 84,
  		// 			"tempo": "Default tempo" });
  		// 	}
  		// 	else{
  		// 		let tempo_bar_beat =
  		// 		mu.bar_and_beat_number_of_ontime(anacrusis, time_sig_array);
  		// 		tempo_changes.unshift({
  		// 			"barOn": 0,
  		// 			"beatOn": tempo_bar_beat[1],
  		// 			"ontime": anacrusis, "bpm": 84, "tempo": "Default tempo" });
  		// 	}
      //
  		// }
  		// // Remove duplicate clef changes.
  		// co.clefChanges = mu.remove_duplicate_clef_changes(clef_changes);
  		// // Append expressions array.
  		// co.expressions = mu.resolve_expressions(xprss_array);
  		// // Append sequencing commands array.
  		// co.sequencing = sequencing;
      // // Append page_layout variable.
  		// co.pageLayout = page_layout;
  		// Append some miscellaneous information.
  		// co.miscXML = { "divisions": divisions, "anacrusis": anacrusis };

    },

    xml2jsonNpo: function(){
      let co = {};
      let composers = [];
      let lyricists = [];

      const self = this;
      xmlpstr(this.data, {trim: true}, function (err, xmlAsJson){
        // console.log("xmlAsJson:", xmlAsJson)
        let metadata = [];
        if (xmlAsJson['score-partwise'].credit){
    			metadata = xmlAsJson['score-partwise'].credit;
    		}
    		for (let meti = 0; meti < metadata.length; meti++){
    			if (
            metadata[meti].$ !== undefined &&
            metadata[meti].$.page == 1 &&
  					metadata[meti]["credit-words"][0].$["font-size"] >= "18" &&
  					metadata[meti]["credit-words"][0].$.justify == "center" &&
  					metadata[meti]["credit-words"][0].$.valign == "top"
          ){
    				// This is probably the title.
    				// console.log(metadata[meti]["credit-words"][0]._);
    				co.name = metadata[meti]["credit-words"][0]._;
    				co.id = co.name.toLowerCase().replace(/\s/gi,'_').replace(/[^a-z0-9_]/gi,'');
    			}
    			if (
            metadata[meti].$ !== undefined &&
            metadata[meti].$.page == 1 &&
  					metadata[meti]["credit-words"][0].$["font-size"] < "18" &&
  					metadata[meti]["credit-words"][0].$.justify == "center" &&
  					metadata[meti]["credit-words"][0].$.valign == "top"
          ){
    				// This is probably the subtitle.
    				// console.log(metadata[meti]["credit-words"][0]._);
    				co.remarks = metadata[meti]["credit-words"][0]._;
    			}
    			if (
            metadata[meti].$ !== undefined &&
            metadata[meti].$.page == 1 &&
  					// metadata[meti]["credit-words"][0].$["font-size"] == "12" &&
  					metadata[meti]["credit-words"][0].$.justify == "right" // &&
  					// metadata[meti]["credit-words"][0].$.valign == "top"
  				){
    				// This is probably the composer.
    				let display_name = metadata[meti]["credit-words"][0]._;
    				let name_array = display_name.toLowerCase().split(' ');
    				let name = name_array[name_array.length - 1];
    				for (let namei = 0; namei < name_array.length - 1; namei++){
    					name = name + '_' + name_array[namei];
    				}
    				// Add a default composer ID for now.
    				let composer_id = "HH123F";
    				composers.push({"id": composer_id, "name": name,
    											  "displayName": display_name});
    			}
    			if (
            metadata[meti].$ !== undefined &&
            metadata[meti].$.page == 1 &&
  					// metadata[meti]["credit-words"][0].$["font-size"] == "12" &&
  					metadata[meti]["credit-words"][0].$.justify == "left" // &&
  					// metadata[meti]["credit-words"][0].$.valign == "top"
  				){
    				// This is probably the lyricist.
    				let display_name = metadata[meti]["credit-words"][0]._;
    				let name_array = display_name.toLowerCase().split(' ');
    				let name = name_array[name_array.length - 1];
    				for (let namei = 0; namei < name_array.length - 1; namei++){
    					name = name + '_' + name_array[namei];
    				}
    				// Add a default lyricist ID for now.
    				let lyricist_id = "HL321X";
    				lyricists.push({"id": lyricist_id, "name": name,
    											  "displayName": display_name});
    			}
    			if (
            metadata[meti].$ !== undefined &&
            metadata[meti].$.page == 1 &&
  					// metadata[meti]["credit-words"][0].$["font-size"] == "8" &&
  					metadata[meti]["credit-words"][0].$.justify == "center" &&
  					metadata[meti]["credit-words"][0].$.valign == "bottom"
          ){
    				// This is probably the copyright.
    				co.copyright = metadata[meti]["credit-words"][0]._;
    			}
    		}
    		co.composers = composers;
    		co.lyricists = lyricists;
    		if (co.name == undefined){
    			co.name = "Insert title here";
    		}
    		if (co.copyright == undefined){
    			co.copyright = "Insert copyright message here";
    		}

    		// Staff and clef names.
    		// Get the staff names, abbreviations, IDs, and initial associated clefs
    		// (for clef changes, see further below). We include initial associated
    		// clefs because often people use these instead of instrument names to
    		// refer to staves.
    		let staff_and_clef_names = [];
    		let staff_no = 0;
    		if (xmlAsJson["score-partwise"]["part-list"]){
    			let part_list = xmlAsJson["score-partwise"]["part-list"];
    			if (part_list[0]["score-part"]){
    				for (let parti = 0; parti < part_list[0]["score-part"].length; parti++){
    					// console.log('score_part:');
    					// console.log(part_list[0]["score-part"][parti]);
    					let curr_staff = {};
    					curr_staff.name = part_list[0]["score-part"][parti]["part-name"][0];
    					if (part_list[0]["score-part"][parti]["part-abbreviation"]){
    						curr_staff.abbreviation
    							= part_list[0]["score-part"][parti]["part-abbreviation"][0];

    					}
    					curr_staff.id = part_list[0]["score-part"][parti].$.id;
    					// Use the ID to find the initial associated clef.
    					curr_staff.clef = "unknown";
    					let target_idx = -1;
    					if (xmlAsJson["score-partwise"]["part"]){
    						let partj = 0;
    						while (partj < xmlAsJson["score-partwise"]["part"].length){
    							if (xmlAsJson["score-partwise"]["part"][partj].$.id == curr_staff.id){
    								target_idx = partj;
    								partj = xmlAsJson["score-partwise"]["part"].length - 1;
    							}
    							partj++;
    						}
    					}
    					// console.log('target_idx:');
    					// console.log(target_idx);
    					if (target_idx >= 0 &&
    							xmlAsJson["score-partwise"]["part"][target_idx] &&
    							xmlAsJson["score-partwise"]["part"][target_idx].measure &&
    							xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes){
    						let curr_attr = xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes;
    						// console.log('curr_attr:');
    						// console.log(curr_attr);
    						// We found the associated part - try to find the associated clef.
    						let clef_attr = xmlAsJson["score-partwise"]["part"][target_idx].measure[0].attributes[0].clef;
    						// Handle MusicXML files created by hum2xml.
    						if (clef_attr == undefined){
    							let attri = 0;
    							while (attri < curr_attr.length){
    								if (curr_attr[attri].clef){
    									clef_attr = curr_attr[attri].clef;
    									attri = curr_attr.length - 1;
    								}
    								attri++;
    							}
    						}
    						if (clef_attr == undefined){
    							console.log('Could not associate any clefs with part ID: ' +
    													curr_staff.id);
    							console.log('We recommend editing the MusicXML file to ' +
    													'explicity specify clefs for each staff, prior to ' +
    													'upload.');
    							curr_staff.staffNo = staff_no;
    							// console.log('curr_staff:');
    							// console.log(curr_staff);
    							staff_and_clef_names.push(mu.copy_array_object(curr_staff));
    							staff_no = staff_no + 1;
    						}
    						else {
    							// console.log('clef_attr:');
    							// console.log(clef_attr);
    							for (let clefi = 0; clefi < clef_attr.length; clefi++){
    								curr_staff.clefSign = clef_attr[clefi].sign[0];
    								curr_staff.clefLine = parseInt(clef_attr[clefi].line[0]);
    								if (clef_attr[clefi]["clef-octave-change"]){
    									curr_staff.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
    								}
    								curr_staff.clef = mu.clef_sign_and_line2clef_name(curr_staff.clefSign,
    																																		curr_staff.clefLine,
    																																		curr_staff.clefOctaveChange);
    								curr_staff.staffNo = staff_no;
    								// console.log('curr_staff:');
    								// console.log(curr_staff);
    								staff_and_clef_names.push(mu.copy_array_object(curr_staff));
    								staff_no = staff_no + 1;
    							}
    						}
    					}
    				}
    			}
    		}
    		co.staffAndClefNames = staff_and_clef_names;

    		// Key signatures.
    		let key_sig_array = [];
    		co.keySignatures = key_sig_array;
    		// This is populated in the iteration over measures within each part,
    		// because different parts can have independent key signatures.

        // Retrieve all parts in the Music XML file.
        let part = xmlAsJson['score-partwise'].part;

        // Focus on the top staff first, to get things like the divisions value
        // and any time signature changes.
        let measure = part[0].measure;

        // Define the divisions value. There should be one of these for the whole
        // piece of music.
        let divisions;
        if(measure[0].attributes){
          let attributes = measure[0].attributes;
          for(let j = 0; j < attributes.length; j++){
            if(attributes[j].divisions){
              divisions = parseInt(attributes[j].divisions[0]);
              console.log('Divisions: ' + divisions);
            }
          }
        }

        // Handle an anacrusis here.
    		// console.log('bar_1:');
    		// console.log(measure[0]);
    		let anacrusis_and_crotchets_per_bar
    		  = mu.convert_1st_bar2anacrusis_val(measure[0], divisions);
    		let anacrusis = anacrusis_and_crotchets_per_bar[0];
    		let crotchets_per_bar = anacrusis_and_crotchets_per_bar[1];
    		console.log('anacrusis:');
    		console.log(anacrusis);
    		console.log('crotchets_per_bar:');
    		console.log(crotchets_per_bar);

    		// Time signatures array. We only need to do this for one staff. It should
    		// apply across all other staves.
        let time_sig_array = [];
        for (let measure_index = 0; measure_index < measure.length; measure_index++){
          if (measure[measure_index].attributes){
            let attributes = measure[measure_index].attributes;
            for (let j = 0; j < attributes.length; j++){
              if (attributes[j].time){
                // Assuming there is only one time per attribute...
                let time_sig_curr = {};
                time_sig_curr.barNo = measure_index + (anacrusis == 0);
                time_sig_curr.topNo = parseInt(attributes[j].time[0].beats[0]);
                time_sig_curr.bottomNo = parseInt(attributes[j].time[0]['beat-type'][0]);
                console.log('A time signature in bar: ' + time_sig_curr.barNo + ', top number: ' + time_sig_curr.topNo
    												+ ', bottom number: ' + time_sig_curr.bottomNo);
                // console.log(attributes[j].time[0].beats[0])+"\n";
                time_sig_array.push(time_sig_curr);
              }
            }
          }
        }
    		if (anacrusis != 0) {
    			time_sig_array
    			  = mu.append_ontimes_to_time_signatures(
    				  time_sig_array, crotchets_per_bar);
        }
    		else {
    			time_sig_array = mu.append_ontimes_to_time_signatures(time_sig_array);
        }
        // console.log('Time signatures array: ' + time_sig_array);
        co.timeSignatures = time_sig_array;

    		// Tempo changes.
    		let tempo_changes = [];
    		co.tempi = tempo_changes;

    		// Clef changes.
    		let clef_changes = [];
    		co.clefChanges = [];

    		// Sequencing (repeat marks, 1st, 2nd time, da capo, etc.). We only need to
    		// do this for one staff. It should apply across all other staves.
    		let sequencing = [];
    		for (let measure_index = 0; measure_index < measure.length; measure_index++){
    			// Direction to do with barline, or 1st, 2nd-time bars.
          if (measure[measure_index].barline){
            let barline = measure[measure_index].barline;
            for (let j = 0; j < barline.length; j++){
    					// console.log('sequencing command:');
    					// console.log(barline[j].repeat);
    					let curr_sequence = {};
    					curr_sequence.barNo = measure_index + (anacrusis == 0);
    					curr_sequence.type = "barline";
    					if (barline[j].$ && barline[j].$.location){
    						curr_sequence.location = barline[j].$.location;
    					}
    					if (barline[j].ending){
    						curr_sequence.endingNo = barline[j].ending[0].$.number;
    						curr_sequence.endingType = barline[j].ending[0].$.type;
    					}
    					if (barline[j].style){
    						curr_sequence.style = barline[j].style;
    					}
    					if (barline[j].repeat){
    						curr_sequence.repeatDir = barline[j].repeat[0].$.direction;
    					}
    					// console.log('Bar number:');
    					// console.log(curr_sequence.barNo);
    					// console.log('curr_sequence:');
    					// console.log(curr_sequence);
    					curr_sequence.ontime
    					  = mu.ontime_of_bar_and_beat_number(
    							curr_sequence.barNo, 1, time_sig_array);
    					sequencing.push(curr_sequence);
            }
          }
    			// Direction like dal segno.
    			if (measure[measure_index].direction){
    				let direction = measure[measure_index].direction;
    				for (let j = 0; j < direction.length; j++){
    					if (direction[j]["direction-type"] &&
    							direction[j]["direction-type"][0].words){
    						// console.log('direction:');
    						// console.log(direction[j]);
    						let poss_commands = ["Fine", "D.C.", "D.C. al Fine",
    																 "D.C. al Coda", "D.S. al Coda",
    																 "D.S. al Fine", "D.S.", "To Coda"];
    						let target_idx
    							= poss_commands.indexOf(direction[j]["direction-type"][0].words[0]);
    						// console.log('target_idx:');
    						// console.log(target_idx);
    						if (target_idx >= 0){
    							let curr_sequence = {};
    							curr_sequence.barNo = measure_index + (anacrusis == 0);
    							curr_sequence.type = "command";
                  if (direction[j].$ !== undefined){
    							  curr_sequence.placement = direction[j].$.placement;
                  }
    							curr_sequence.words = direction[j]["direction-type"][0].words[0];
    							curr_sequence.ontime
    								= mu.ontime_of_bar_and_beat_number(
    									curr_sequence.barNo, 1, time_sig_array);
    							sequencing.push(curr_sequence);
    						}
    					}
    				}
    			}
        }

    		// Define the page layout array object, which contains information relating
    		// to system breaks, page breaks, system spacers, etc. For page and system
    		// breaks, current thinking is we only need to do this for one staff,
    		// because it should apply. Spacers (which put a bit more or less space
    		// between pairs of staves within or between systems when required) do not
    		// seem to be exported in the MusicXML file, but if they were, these would
    		// need identifying across all parts.
    		let page_layout = {};
    		let page_breaks = [];
    		let system_breaks = [];
    		// let spacers = [];
    		for (let measure_index = 0; measure_index < measure.length; measure_index++){
          if(measure[measure_index].print){
    				// console.log('Print command!');
    				// console.log(measure[measure_index].print);
    				let print_array = measure[measure_index].print;
    				for (let printi = 0; printi < print_array.length; printi++){
    					if (print_array[printi].$ &&
    							print_array[printi].$["new-page"]){
    						page_breaks.push(measure_index + (anacrusis == 0));
    					}
    					if (print_array[printi].$ &&
    							print_array[printi].$["new-system"]){
    						system_breaks.push(measure_index + (anacrusis == 0));
    					}
    				}
    			}
    		}
    		if (page_breaks.length == 0 && system_breaks.length == 0){
    			// Insert default page and system breaks.
    			let page_and_system_breaks
    			  = mu.default_page_and_system_breaks(
    					staff_and_clef_names, measure.length);
    			page_breaks = page_and_system_breaks[0];
    			system_breaks = page_and_system_breaks[1];
    		}
    		page_layout.pageBreaks = page_breaks;
    		page_layout.systemBreaks = system_breaks;

        // Iterate over each part and build up the notes array.

        // Define the notes array.
        let notes_array = [];
    		let noteID = 0;
    		let tied_array = [];
    		let grace_array = [];
    		// Define the rests array. This is not necessary for displaying a freshjam
    		// project, but the information is present in the MusicXML file (and could
    		// help us display the traditional staff notation). So in the interests of
    		// lossless conversion, I'm storing the rest information too.
    		let rests_array = [];
    		let restID = 0;
    		// Define the expressions array. This is not necessary for displaying a
    		// freshjam project, but the information is present in the MusicXML file
    		// (and could help us display the traditional staff notation). So in the
    		// interests of lossless conversion, I'm storing the rest information too.
    		let xprss_array = [];
    		let xprssID = 0;

        for (let part_idx = 0; part_idx < part.length; part_idx++){

          console.log('Part: ' + part_idx);
    			let ontime = anacrusis;
    			// Incrementing integer representation of ontime, using divisions.
    			let intOnt = anacrusis*divisions;
    			let part_id = part[part_idx].$.id;
    			// This variable tells you which staff number(s) should be associated
    			// with a particular part. In MusicXML 2.0, keyboard instruments such as
    			// piano or harpsichord will have two staves written within one part.
    			let staff_nos_for_this_id = [];
    			for (let staffi = 0; staffi < staff_and_clef_names.length; staffi++){
    				if (staff_and_clef_names[staffi].id == part_id){
    					staff_nos_for_this_id.push(staff_and_clef_names[staffi].staffNo);
    				}
    			}
    			// console.log('staff_nos_for_this_id:');
    			// console.log(staff_nos_for_this_id);

          measure = part[part_idx].measure;
          for (let measure_index = 0; measure_index < measure.length; measure_index++){

            // console.log('\nMeasure: ' + measure_index);

    				// Key signatures and clef changes.
    				if(measure[measure_index].attributes){
    					let attributes = measure[measure_index].attributes;
    					// console.log('attributes:');
    					// console.log(attributes);
    					for(let j = 0; j < attributes.length; j++){
    						// Key signatures.
    						if(attributes[j].key){
    							// console.log('key:');
    							// console.log(attributes[j].key);
    							let curr_key = {};
    							curr_key.barNo = measure_index + (anacrusis == 0);
    							if (attributes[j].key[0].mode == undefined){
    								attributes[j].key[0].mode = ['major'];
    							}
    							curr_key.keyName
    							= mu.nos_symbols_and_mode2key_name(attributes[j].key[0].fifths[0],
    																									 attributes[j].key[0].mode[0]);

    							// It is important to realise that when a MusicXML file says
    							// fifths, what it means is the number of sharps (positive
    							// integer) or flats (negative integer) in the key signature. So
    							// A minor will have a fifths value of 0, but A is three steps
    							// clockwise from C on the circle of fifths, so this code adjusts
    							// the fifths value of minor keys to reflect this.
    							switch(attributes[j].key[0].mode[0]){
    								case 'minor':
    									curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]) + 3;
    									break;
    								default:
    									curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]);
    									break;
    							}
    							switch(attributes[j].key[0].mode[0]){
    								case 'major':
    									curr_key.mode = 0;
    									break;
    								case 'minor':
    									curr_key.mode = 5;
    									break;
    								case 'ionian':
    									curr_key.mode = 0;
    									break;
    								case 'dorian':
    									curr_key.mode = 1;
    									break;
    								case 'phrygian':
    									curr_key.mode = 2;
    									break;
    								case 'lydian':
    									curr_key.mode = 3;
    									break;
    								case 'mixolydian':
    									curr_key.mode = 4;
    									break;
    								case 'aeolian':
    									curr_key.mode = 5;
    									break;
    								case 'locrian':
    									curr_key.mode = 6;
    									break;
    							}
    							curr_key.staffNo = []; // Populated in for loop below.
    							// Get ontime from bar number rather than from the ontime
    							// variable, because there could still be rounding errors here.
    							curr_key.ontime
    								= mu.ontime_of_bar_and_beat_number(curr_key.barNo, 1, time_sig_array);
    							for (let staffi = 0; staffi < staff_nos_for_this_id.length; staffi++){
    								curr_key.staffNo = staff_nos_for_this_id[staffi];
    								key_sig_array.push(mu.copy_array_object(curr_key));
    							}
    						}

    						// Clef changes.
    						if(attributes[j].clef){
    							let clef_attr = attributes[j].clef;
    							// console.log('clef in measure ' + measure_index + ':');
    							// console.log(clef_attr);
    							let curr_clef = {};
    							curr_clef.barNo = measure_index + (anacrusis == 0);
    							// Get ontime from bar number rather than from the ontime
    							// variable, because there could still be rounding errors here.
    							curr_clef.ontime
    								= mu.ontime_of_bar_and_beat_number(curr_clef.barNo, 1, time_sig_array);
    							curr_clef.clef = "unknown"; // Populated below.
    							for (let clefi = 0; clefi < clef_attr.length; clefi++){
    								curr_clef.clefSign = clef_attr[clefi].sign[0];
    								curr_clef.clefLine = parseInt(clef_attr[clefi].line[0]);
    								if (clef_attr[clefi]["clef-octave-change"]){
    									curr_clef.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
    								}
    								curr_clef.clef = mu.clef_sign_and_line2clef_name(curr_clef.clefSign,
    																																		curr_clef.clefLine,
    																																		curr_clef.clefOctaveChange);
    								if (clef_attr[clefi].$ && clef_attr[clefi].$.number){
    									// console.log('clef number:');
    									// console.log(clef_attr[clefi].$.number);
    									curr_clef.staffNo
    									  = staff_nos_for_this_id[parseInt(clef_attr[clefi].$.number[0]) - 1];
    								}
    								else {
    									curr_clef.staffNo = staff_nos_for_this_id[0];
    								}
    								// curr_clef.staffNo = staff_no;
    								// console.log('curr_staff:');
    								// console.log(curr_staff);
    								clef_changes.push(mu.copy_array_object(curr_clef));
    								// staff_no = staff_no + 1;
    							}
    						}
    					}
    				}

    				// Tempo changes and expressions.
    				if (measure[measure_index].direction){
    					let direction = measure[measure_index].direction;
    					for (let j = 0; j < direction.length; j++){
    						// Tempo change.
    						if (direction[j].sound &&
    								direction[j].sound[0].$ &&
    								direction[j].sound[0].$.tempo){
    							let curr_tempo = {};
    							// Timing will need updating to be more precise.
    							curr_tempo.barOn = measure_index + (anacrusis == 0);
    							curr_tempo.beatOn = 1;
    							curr_tempo.ontime
    							  = mu.ontime_of_bar_and_beat_number(
    									curr_tempo.barOn, 1, time_sig_array);
    							curr_tempo.bpm = parseFloat(direction[j].sound[0].$.tempo);
    							// console.log('direction-type:');
    							// console.log(direction[j]["direction-type"]);
    							if (direction[j]["direction-type"] &&
    									direction[j]["direction-type"][0].words){
    								curr_tempo.tempo = direction[j]["direction-type"][0].words[0];
    							}
    							if (mu.array_object_index_of(
    										tempo_changes, curr_tempo.ontime, "ontime") == -1){
    								// Some MusicXML files contain duplicate tempo instructions.
    								// The check above will not allow tempo instructions with the
    								// same ontime as an existing tempo instruction to be inserted
    								// in the tempo_changes array.
    								tempo_changes.push(curr_tempo);
    							}
    						}
    						// Expression - dynamic.
    						if (direction[j]["direction-type"] &&
    								direction[j]["direction-type"][0].dynamics){
    							let curr_xprss = {};
    							curr_xprss.ID = xprssID.toString();
    							// Timing will need updating to be more precise.
    							curr_xprss.barOn = measure_index + (anacrusis == 0);
    							curr_xprss.beatOn = 1;
    							curr_xprss.ontime
    							  = mu.ontime_of_bar_and_beat_number(
    									curr_xprss.barOn, 1, time_sig_array);
    							for (let key in direction[j]["direction-type"][0].dynamics[0]){
    								// This is not really a loop because there is probably only one
    								// key.
    								curr_xprss.type = { "dynamics": key };
                    if (direction[j].$ !== undefined){
                      curr_xprss.placement = direction[j].$.placement;
                    }
    								if (direction[j].staff){
    									curr_xprss.staffNo
    									  = staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
    								}
    								else {
    									curr_xprss.staffNo = staff_nos_for_this_id[0];
    								}
    								xprss_array.push(curr_xprss);
    								xprssID++;
    							}
    						}
    						// Expression - wedge.
    						if (direction[j]["direction-type"] &&
    								direction[j]["direction-type"][0].wedge){
    							let curr_xprss = {};
    							curr_xprss.ID = xprssID.toString();
    							// Timing will need updating to be more precise.
    							curr_xprss.barOn = measure_index + (anacrusis == 0);
    							curr_xprss.beatOn = 1;
    							curr_xprss.ontime
    							  = mu.ontime_of_bar_and_beat_number(
    									curr_xprss.barOn, 1, time_sig_array);
    							// console.log('wedge:');
    							// console.log(direction[j]["direction-type"][0].wedge[0]);
    							curr_xprss.type = { "wedge": direction[j]["direction-type"][0].wedge[0].$.type };
                  if (direction[j].$ !== undefined){
                    curr_xprss.placement = direction[j].$.placement;
                  }
    							if (direction[j].staff){
    									curr_xprss.staffNo
    									= staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
    							}
    							else {
    								curr_xprss.staffNo = staff_nos_for_this_id[0];
    							}
    							xprss_array.push(curr_xprss);
    							xprssID++;
    						}
    					}
    				}

    				// Grab the number of backups, which are used to encode multiple voices
            // in one measure on one staff.
            let backups, time_at_end_of_this_bar;
            if (measure[measure_index].backup){
              backups = measure[measure_index].backup;
              // Filter out any backup values that are not equal to the maximum
              // backup value. A POTENTIALLY DANGEROUS STRATEGY, but need a way to
              // take account of backups that are associated with cue notes and so
              // do not advance voiceNo in the usual way.
              const maxBackup = mu.max_argmax(backups.map(function(b){
                return b.duration[0]
              }))[0];
              const fullBarBackups = [];
              backups.forEach(function(b){
                if (b.duration[0] === maxBackup){
                  fullBarBackups.push(b);
                }
              });
              backups = fullBarBackups;

              // console.log('Backup: ' + backups);
              time_at_end_of_this_bar =
    					  mu.ontime_of_bar_and_beat_number(
    						  measure_index + (anacrusis == 0) + 1, 1, time_sig_array);
              // console.log('Time at end of bar: ' + time_at_end_of_this_bar);
            }

            if (measure[measure_index].note){
              let notes = measure[measure_index].note;
              // console.log('notes:', notes)

              let voiceNo = 0; // Increment this with appearances of backup.
              for (let note_index = 0; note_index < notes.length; note_index++){

                // console.log('Note index: ' + note_index);
                let note_curr = {};
                let rest = 0; // Detect if it is a rest instead of a note.
    						let rest_curr = {};

                if (
                  notes[note_index].grace === undefined &&
                  notes[note_index].cue === undefined
                ){
                  // Handle pitch information.
                  // console.log("notes[note_index].pitch:", notes[note_index].pitch)
                  if (notes[note_index].pitch){
                    // console.log("INSIDE!")
                    // console.log("notes[note_index].pitch[0]:", notes[note_index].pitch[0])
    								let final_pitch =
    									self.xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0], true);
                    // console.log("final_pitch:", final_pitch)
                    if (final_pitch == undefined){
                      console.log("notes[note_index].pitch[0]:", notes[note_index].pitch[0]);
                      console.log("final_pitch:", final_pitch);
                    }
    								let MNN_MPN = mu.pitch_and_octave2midi_note_morphetic_pair(final_pitch);
                    // Populate note_curr properties.
    								note_curr.ID = noteID.toString();
    								// console.log('NoteID: ' + note_curr.ID);
    								noteID++;
                    note_curr.pitch = final_pitch;
                    note_curr.MNN = MNN_MPN[0];
                    note_curr.MPN = MNN_MPN[1];
    								// console.log('Pitch: ' + final_pitch + ', MNN: ' + MNN_MPN[0] + ', MPN: ' + MNN_MPN[1]);
                  }
                  else { // Rest.
                    rest = 1;
    								rest_curr.ID = restID.toString();
    								restID++;
                  }

    							// Handle timing information.
    							// Begin with the integer duration expressed in MusicXML divisions.
    							let intDur = parseInt(notes[note_index].duration[0]);
                  // This is duration in crotchet beats rounded to 5 decimal places.
                  let duration = Math.round(intDur/divisions*100000)/100000;
    							// This is offtime in crotchet beats rounded to 5 decimal places.
    							let offtime = Math.round((intOnt + intDur)/divisions*100000)/100000;

    							let bar_beat = mu.bar_and_beat_number_of_ontime(ontime, time_sig_array);
                  let barOn = bar_beat[0];
                  let beatOn = Math.round(bar_beat[1]*100000)/100000;
                  bar_beat = mu.bar_and_beat_number_of_ontime(offtime, time_sig_array);
                  let barOff = bar_beat[0];
                  let beatOff = Math.round(bar_beat[1]*100000)/100000;

    							// Legacy version in operation from November 2014 to August 2015
    							// that did not handle tuplets properly (led to rounding errors).
    							//if (notes[note_index]['time-modification']){
    							//	// Some kind of tuplet, but actually I think duration calculation does not change.
    							//	// This is duration in crotchet beats rounded to 5 decimal places.
    							//	let duration = Math.round(intDur/divisions*100000)/100000;
    							//	//let dur_unround = intDur/divisions;
    							//	//let duration = Math.round(dur_unround
    							//	//                          *notes[note_index]['time-modification'][0]['normal-notes'][0]
    							//	//                          /notes[note_index]['time-modification'][0]['actual-notes'][0]
    							//	//                          *100000)/100000;
    							//}
    							//else {
    							//	// This is duration in crotchet beats rounded to 5 decimal places.
    							//	let duration = Math.round(intDur/divisions*100000)/100000;
    							//}
    							//// Correct rounding errors in the ontime values.
    							//let onDiscrep = Math.ceil(ontime) - ontime;
    							//if (onDiscrep < .00002){
    							//	ontime = Math.ceil(ontime);
    							//}
    							//let offtime = Math.round((ontime + duration)*100000)/100000;
    							//// Correct rounding errors in the offtime values.
    							//let offDiscrep = Math.ceil(offtime) - offtime;
    							//if (offDiscrep < .00002){
    							//	offtime = Math.ceil(offtime);
    							//}

    							// Useful debug for checking rounding errors.
    							//if (note_curr.ID == '666') {
    							//	let testSum = Math.round((ontime + intDur/divisions)*100000)/100000;
    							//	console.log('barOn: ' + barOn);
    							//	console.log('beatOn: ' + beatOn);
    							//	console.log('divisions: ' + divisions);
    							//	console.log('intDur: ' + intDur);
    							//	console.log('ontime: ' + ontime);
    							//	// console.log('onDiscrep: ' + onDiscrep);
    							//	console.log('offtime: ' + offtime);
    							//	// console.log('offDiscrep: ' + offDiscrep);
    							//	console.log('testSum: ' + testSum);
    							//	console.log('intOnt: ' + intOnt);
    							//}

                  // Populate note_curr properties or rest_curr properties.
    							if (rest == 0){
    								note_curr.barOn = barOn;
    								note_curr.beatOn = beatOn;
    								note_curr.ontime = ontime;
    								note_curr.duration = duration;
    								note_curr.barOff = barOff;
    								note_curr.beatOff = beatOff;
    								note_curr.offtime = offtime;
    								let staff_and_voice_nos
    								  = mu.staff_voice_xml2staff_voice_json(
    										notes[note_index].voice, staff_nos_for_this_id, part_idx);
    								note_curr.staffNo = staff_and_voice_nos[0];
    								note_curr.voiceNo = staff_and_voice_nos[1];
    								// Could add some more properties here, like integer duration
    								// as expressed in the MusicXML file, stem direction, etc. NB,
    								// if there are ties here, properties such as intDur, type,
    								// stem, beam, etc. are not accurate reflections of the summary
    								// oblong properties, and they are removed by resolve_ties.
    								// Lyric.
    								if (notes[note_index].lyric){
    									let lyric_arr = notes[note_index].lyric;
    									let lyric = [];
    									for (let ily = 0; ily < lyric_arr.length; ily++){
    										let lyric_curr = {};
    										lyric_curr.number = parseInt(lyric_arr[ily].$.number);
    										// console.log('lyric_arr[ily].text[0]._:');
    										// console.log(lyric_arr[ily].text[0]._);
    										lyric_curr.syllabic = lyric_arr[ily].syllabic[0];
                        if (lyric_arr[ily].text[0]._ == undefined){
                          lyric_curr.text = lyric_arr[ily].text[0];
                        }
                        else {
                          lyric_curr.text = lyric_arr[ily].text[0]._;
                        }
    										if (lyric_arr[ily].text[0].$ !== undefined &&
                            lyric_arr[ily].text[0].$["font-family"] !== undefined){
                          lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-family"];
                        }
                        if (lyric_arr[ily].text[0].$ !== undefined &&
                            lyric_arr[ily].text[0].$["font-size"] !== undefined){
                          lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-size"];
                        }
                        if (lyric_arr[ily].text[0].$ !== undefined &&
                            lyric_arr[ily].text[0].$["font-style"] !== undefined){
                          lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-style"];
                        }
    										lyric.push(lyric_curr);
    									}
    									note_curr.lyric = lyric;
    								}
    								// Integer duration.
    								note_curr.intDur = intDur;
    								// Accidental.
    								if (notes[note_index].accidental){
    									// Written accidentals like natural, sharp, flat, etc.
    									note_curr.accidental = notes[note_index].accidental[0];
    								}
    								// Type.
    								if (notes[note_index].type){
    									// Things like quarter note, eighth note, etc.
    									note_curr.type = notes[note_index].type[0];
    								}
    								// Tuplets.
    								if (notes[note_index]['time-modification']){
    									note_curr.timeMod = {
    										"actualNotes":
    										notes[note_index]['time-modification'][0]['actual-notes'][0],
    										"normalNotes":
    										notes[note_index]['time-modification'][0]['normal-notes'][0]
    									};
    								}
    								// Stems.
    								if (notes[note_index].stem){
    									note_curr.stem = notes[note_index].stem[0];
    								}
    								// Beams.
    								if (notes[note_index].beam){
    									let beams = [];
    									for (let ibeam = 0; ibeam < notes[note_index].beam.length; ibeam++){
    										let beam_curr = {};
    										beam_curr.number = parseInt(notes[note_index].beam[ibeam].$.number);
    										if (notes[note_index].beam[ibeam].$.accel){
    											beam_curr.accel = notes[note_index].beam[ibeam].$.accel;
    										}
    										beam_curr.type = notes[note_index].beam[ibeam]._;
    										beams.push(beam_curr);
    									}
    									note_curr.beam = beams;
    								}
    								// Notations.
    								if (notes[note_index].notations){
    									let notations = {};
    									// Articulations.
                      let articulations;
    									if (notes[note_index].notations[0].articulations){
    										let artic_arr = notes[note_index].notations[0].articulations[0];
    										// console.log('articulations:');
    										// console.log(artic_arr);
    										articulations = {};
    										for (let key in artic_arr){
    											articulations[key] = {};
                          // articulations.push(key);
    										}
    										notations.articulations = articulations;
    									}
                      // Include fermata in articulations also.
    									if (notes[note_index].notations[0].fermata){
                        if (articulations == undefined){
                          // console.log('We got here with artics.');
                          articulations = {};
                        }
    										let fermata_arr = notes[note_index].notations[0].fermata;
                        for (let iferm = 0; iferm < fermata_arr.length; iferm++){
                          if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'upright'){
                            articulations.fermataUpright = {};
                          }
                          if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'inverted'){
                            articulations.fermataInverted = {};
                          }
                          if (fermata_arr[iferm].$ === undefined && fermata_arr[iferm] === 'square') {
                            articulations.fermataSquare = {};
                          }
    										}
                        if (notations.articulations == undefined){
                          notations.articulations = articulations;
                          // console.log('We got here with notations.articulations');
                          // console.log(notations.articulations);
                        }
    										//let fermata = [];
    										//for (iferm = 0; iferm < fermata_arr.length; iferm++){
    										//	fermata.push(fermata_arr[iferm].$.type);
    										//}
    										//notations.fermata = fermata;
    									}
    									// Ornaments.
    									if (notes[note_index].notations[0].ornaments){
    										let ornam_arr = notes[note_index].notations[0].ornaments[0];
    										let ornaments = [];
    										for (let key in ornam_arr){
    											ornaments.push(key);
    										}
    										notations.ornaments = ornaments;
    									}
    									// Slurs.
    									if (notes[note_index].notations[0].slur){
    										let slur_arr = notes[note_index].notations[0].slur;
    										// console.log('slur:');
    										// console.log(slur_arr);
    										let slur = [];
    										for (let islur = 0; islur < slur_arr.length; islur++){
    											let slur_curr = {};
    											slur_curr.number = parseInt(slur_arr[islur].$.number);
    											slur_curr.type = slur_arr[islur].$.type;
    											slur.push(slur_curr);
    										}
    										notations.slur = slur;
    									}
    									// Technical.
    									if (notes[note_index].notations[0].technical){
    										let techn_arr = notes[note_index].notations[0].technical[0];
    										let technical = [];
    										for (let key in techn_arr){
    											technical.push(key);
    										}
    										notations.technical = technical;
    									}
    									// Tuplet.
    									if (notes[note_index].notations[0].tuplet){
    										let tuplet = notes[note_index].notations[0].tuplet[0];
    										let tupl_curr = {};
    										tupl_curr.type = tuplet.$.type;
    										if (tuplet.$.bracket){
    											tupl_curr.bracket = tuplet.$.bracket;
    										}
                        if (tuplet.$["show-number"]){
                          tupl_curr.showNumber = tuplet.$["show-number"];
                        }
    										notations.tuplet = tupl_curr;
    									}

    									// Assign the notations field to note_curr.
    									note_curr.notations = notations;
    								}

    								if (!notes[note_index].tie){ // there is no tie element
    									// Ordinary untied note. Push it to the notes array.
    									notes_array.push(note_curr);
    								}
    								else { // there is a tie element

                      // you can access attributes using a dollar sign like so:
    									// console.log(notes[note_index].tie[0].$.type)
    									let tie = note_curr.tieType = notes[note_index].tie;
    									if (tie.length > 1) {
    										note_curr.tieType = 'stop and start';
    									}
    									else {
    										note_curr.tieType = tie[0].$.type;
    									}
    									// console.log(note_curr.tieType);

                      // Tied note. Push it to the tied notes array for resolving
                      // below.
                      tied_array.push(note_curr);
    								}
    							}
    							else {
    								rest_curr.barOn = barOn;
    								rest_curr.beatOn = beatOn;
    								rest_curr.ontime = ontime;
    								rest_curr.duration = duration;
    								rest_curr.barOff = barOff;
    								rest_curr.beatOff = beatOff;
    								rest_curr.offtime = offtime;
    								let staff_and_voice_nos
    								  = mu.staff_voice_xml2staff_voice_json(
    										notes[note_index].voice, staff_nos_for_this_id, part_idx);
    								rest_curr.staffNo = staff_and_voice_nos[0];
    								rest_curr.voiceNo = staff_and_voice_nos[1];
    								// Could add some more properties here, like integer duration
    								// as expressed in the MusicXML, etc.
    								rest_curr.intDur = intDur;
    								// Type.
                    if (notes[note_index].type){
    									rest_curr.type = notes[note_index].type[0];
    								}
                    // Tuplets.
                    if (notes[note_index]['time-modification']){
    									rest_curr.timeMod = {
    										"actualNotes":
    										notes[note_index]['time-modification'][0]['actual-notes'][0],
    										"normalNotes":
    										notes[note_index]['time-modification'][0]['normal-notes'][0]
    									};
    								}
                    // Notations.
    								if (notes[note_index].notations){
    									let notations = {};
    									// Articulations.
                      let articulations;
    									if (notes[note_index].notations[0].articulations){
    										let artic_arr = notes[note_index].notations[0].articulations[0];
    										// console.log('articulations:');
    										// console.log(artic_arr);
    										articulations = {};
    										for (let key in artic_arr){
    											articulations[key] = {};
                          // articulations.push(key);
    										}
    										notations.articulations = articulations;
    									}
                      // Include fermata in articulations also.
    									if (notes[note_index].notations[0].fermata){
                        if (articulations == undefined){
                          // console.log('We got here with artics.');
                          articulations = {};
                        }
    										let fermata_arr = notes[note_index].notations[0].fermata;
                        for (let iferm = 0; iferm < fermata_arr.length; iferm++){
                          if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'upright'){
                            articulations.fermataUpright = {};
                          }
                          if (fermata_arr[iferm].$ !== undefined && fermata_arr[iferm].$.type == 'inverted'){
                            articulations.fermataInverted = {};
                          }
                          if (fermata_arr[iferm].$ === undefined && fermata_arr[iferm] === 'square') {
                            articulations.fermataSquare = {};
                          }
    										}
                        if (notations.articulations == undefined){
                          notations.articulations = articulations;
                        }
    									}
    									// Ornaments.
                      // Omitted.

    									// Slurs.
                      // Omitted.

    									// Technical.
    									// Omitted.

    									// Tuplet.
    									if (notes[note_index].notations[0].tuplet){
    										let tuplet = notes[note_index].notations[0].tuplet[0];
    										let tupl_curr = {};
    										tupl_curr.type = tuplet.$.type;
    										if (tuplet.$.bracket){
    											tupl_curr.bracket = tuplet.$.bracket;
    										}
                        if (tuplet.$["show-number"]){
                          tupl_curr.showNumber = tuplet.$["show-number"];
                        }
    										notations.tuplet = tupl_curr;
    									}

    									// Assign the notations field to rest_curr.
    									rest_curr.notations = notations;
    								}
    								rests_array.push(rest_curr);
    							}

                  // If the note is a second, third, etc. note of a chord, then do
                  // not increment the ontime variable.
                  if (note_index < notes.length - 1 && notes[note_index + 1].chord);
                  else { // Do increment the ontime value.
                    ontime = offtime;
    								intOnt = intOnt + intDur;
                  }

                  // Check whether we should switch to define notes in the next voice.
                  // If so, we will need to subtract the backup value from the running
                  // ontime.
                  if (
                    backups !== undefined &&
                    time_at_end_of_this_bar !== undefined
                  ){
                    if (
                      ontime == time_at_end_of_this_bar &&
                      voiceNo < backups.length
                    ){
                      const dur_to_subtract = Math.round(parseInt(backups[voiceNo].duration[0])/divisions
                                                   *100000)/100000;
                      // console.log('We got here!');
                      // console.log('With ontime:');
                      // console.log(ontime);
                      // console.log('And ontime at end of bar:');
                      // console.log(time_at_end_of_this_bar);
                      ontime = ontime - dur_to_subtract;
    									intOnt = intOnt - parseInt(backups[voiceNo].duration[0]);
                      voiceNo++;
                    }
                  }
                }
    						else if (notes[note_index].cue === undefined){
                  // Handle grace notes here. NB grace notes have no duration.
                  let grace_curr;
    							if (notes[note_index].pitch){
                    // Grace notes must, by definition, have a pitch? I'm leaving
    								// the check in here just in case.
    								let final_pitch =
    									self.xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0], true);
    								let MNN_MPN = mu.pitch_and_octave2midi_note_morphetic_pair(final_pitch);
                    // Populate grace_curr properties.
    								grace_curr = {};
    								grace_curr.ID = noteID.toString();
    								noteID++;
    								// console.log('grace:');
    								// console.log(notes[note_index].grace);
    								if (notes[note_index].grace[0].$ != undefined){
    									grace_curr.slash = notes[note_index].grace[0].$.slash;
    								}
                    grace_curr.pitch = final_pitch;
                    grace_curr.MNN = MNN_MPN[0];
                    grace_curr.MPN = MNN_MPN[1];
    								let staff_and_voice_nos
    								  = mu.staff_voice_xml2staff_voice_json(
    										notes[note_index].voice, staff_nos_for_this_id, part_idx);
    								grace_curr.staffNo = staff_and_voice_nos[0];
    								grace_curr.voiceNo = staff_and_voice_nos[1];
    								// Accidental.
    								if (notes[note_index].accidental){
    									// Written accidentals like natural, sharp, flat, etc.
    									grace_curr.accidental = notes[note_index].accidental[0];
    								}
    								// Type.
    								if (notes[note_index].type){
    									// Things like quarter note, eighth note, etc.
    									grace_curr.type = notes[note_index].type[0];
    								}
    							}
    							// Could add more here (e.g., about stems and beams).

    							// Notations.
    							if (notes[note_index].notations){
    								let notations = {};
    								// Slurs.
    								if (notes[note_index].notations[0].slur){
    									let slur_arr = notes[note_index].notations[0].slur;
    									// console.log('slur:');
    									// console.log(slur_arr);
    									let slur = [];
    									for (let islur = 0; islur < slur_arr.length; islur++){
    										let slur_curr = {};
    										slur_curr.number = parseInt(slur_arr[islur].$.number);
    										slur_curr.type = slur_arr[islur].$.type;
    										slur.push(slur_curr);
    									}
    									notations.slur = slur;
    								}

    								// Assign the notations field to grace_curr.
    								grace_curr.notations = notations;
    							}

                  if (grace_curr !== undefined){
                    grace_array.push(grace_curr);
                  }
    						}
                else ;
              }
            }
          }
        } // part
    		// Associate grace notes with the appropriate ordinary notes.
    		let notes_and_tied = self.assoc_grace(notes_array, tied_array, grace_array);
    		notes_array = notes_and_tied[0];
    		tied_array = notes_and_tied[1];

    		// Resolve ties and concatenate them with ordinary notes.
    		notes_and_tied = notes_array.concat(
    			self.resolve_ties(tied_array.sort(mu.sort_points_asc)));
    		co.notes = notes_and_tied.sort(mu.sort_points_asc);

    		// co.notes = notes_array.sort(mu.sort_points_asc);
    		// co.ties = tied_array.sort(mu.sort_points_asc);
    		co.rests = rests_array.sort(mu.sort_points_asc);
    		// co.grace = grace_array;
    		// Include a default tempo if tempo_changes is empty or if no tempo is
    		// specified at the beginning of the piece.
    		if (tempo_changes.length == 0 || tempo_changes[0].ontime > 0){
    			if (anacrusis == 0){
    				tempo_changes.unshift({
    					"barOn": 1, "beatOn": 1, "ontime": 0, "bpm": 84,
    					"tempo": "Default tempo" });
    			}
    			else {
    				let tempo_bar_beat =
    				mu.bar_and_beat_number_of_ontime(anacrusis, time_sig_array);
    				tempo_changes.unshift({
    					"barOn": 0,
    					"beatOn": tempo_bar_beat[1],
    					"ontime": anacrusis, "bpm": 84, "tempo": "Default tempo" });
    			}

    		}
    		// Remove duplicate clef changes.
    		co.clefChanges = mu.remove_duplicate_clef_changes(clef_changes);
    		// Append expressions array.
    		co.expressions = mu.resolve_expressions(xprss_array);
    		// Append sequencing commands array.
    		co.sequencing = sequencing;
        // Append page_layout variable.
    		co.pageLayout = page_layout;
    		// Append some miscellaneous information.
        if (co.miscImport === undefined){
          co.miscImport = {};
        }
        if (co.miscImport.musicXml === undefined){
          co.miscImport.musicXml = {
            "divisions": divisions, "anacrusis": anacrusis
          };
        }
    		// console.log('HERE')
        // return co;
        // console.log("co:", co)
    		// callback(co);
      });

      return co
    },

    resolve_ties: function(ties){
    	// Tom Collins 24/11/2014.
      // This function takes note objects that are the beginning of tied events,
    	// part way through tied events, or the end of tied events. It joins these
    	// together into one summary note for the purposes of oblong (piano-roll)
    	// display, but saves the details of the tie information in a property called
    	// ties. It cannot be assumed that the ties variable is in ascending
    	// lexicographic order, because the MusicXMl file may have been encoded by
      // voice, in which case it's possible (though unlikely) that the
      // continuation or resolution of a tied note is encountered before the start
      // itself (e.g., due to voice swap).

      // So we begin with a lexicographic sort.
      ties.sort(mu.sort_points_asc);

    	// Create a variable that contains all the tie start events.
    	let tie_starts = [];
    	for (let inote = ties.length - 1; inote >= 0; inote--){
    		if (ties[inote].tieType == 'start'){
    			tie_starts.unshift(ties[inote]);
    			ties.splice(inote, 1);
    		}
    	}
    	// console.log('tie_starts:');
    	// console.log(tie_starts);
    	// console.log('ties:');
    	// console.log(ties);

    	// Loop over tie_starts, resolve the ties for each element, and compile them
    	// within notes.
    	let notes = [];
    	for (let itie = 0; itie < tie_starts.length; itie++){
    		let tie_start = tie_starts[itie];
    		// First define the note/oblong, which will summarise all the tied events
    		// for this pitch.
    		let note = {};
    		for (let key in tie_start){
    			if (key != 'tieType' && key != 'intDur' && key != 'accidental' &&
    					key != 'type' && key != 'timeMod' && key != 'stem' &&
    					key != 'beam' && key != 'notations' && key != 'grace'){
    				note[key] = tie_start[key];
    			}
    		}

    		// if (itie <= 3){
    		// 	console.log('starting note:');
    		// 	console.log(itie);
    		// 	console.log('note:');
    		// 	console.log(note);
    		// }

    		// Find all events involved in the tie.
    		let tie = [];
    		tie[0] = tie_start;
    		let idxs_to_remove = [];
    		let inote = 0;
    		while (inote < ties.length){

    			// if (itie <= 3 && ties[inote].pitch == 'C5'){
    			// 	console.log('starting note:');
    			// 	console.log(itie);
    			// 	console.log('early C5 is amongst the ties:');
    			// 	console.log(inote);
    			// 	console.log('ties[inote]:');
    			// 	console.log(ties[inote]);
    			// }

    			if (ties[inote].pitch == note.pitch &&
    					ties[inote].staffNo == note.staffNo){
    				tie.push(ties[inote]);
    				idxs_to_remove.push(inote);
    				if (ties[inote].tieType == 'stop'){
    					inote = ties.length - 1;
    				}
    			}
    			inote=inote+1;
    		}
    		// Remove the discovered events.

    		// if (itie <= 3){
    		// 	console.log('which indices gets removed for this starting note?:');
    		// 	console.log(idxs_to_remove);
    		// 	console.log('ties pre-splicing:');
    		// 	console.log(ties.slice(0, 3));
    		// }

    		for (let idx = idxs_to_remove.length - 1; idx >= 0; idx--){
    			ties.splice(idxs_to_remove[idx], 1);
    		}

    		// if (itie <= 3){
    		// 	console.log('ties post-splicing:');
    		// 	console.log(ties.slice(0, 3));
    		// }

    		// Update the barOff, beatOff, offtime, and duration of the summary oblong.
    		if (tie.length > 0 &&
    				tie[tie.length - 1].tieType == 'stop'){
    			// There was a completion to this tie.
    			note.barOff = tie[tie.length - 1].barOff;
    			note.beatOff = tie[tie.length - 1].beatOff;
    			note.offtime = tie[tie.length - 1].offtime;
    			// This is duration in crotchet beats rounded to 5 decimal places.
    			note.duration = Math.round((note.offtime - note.ontime)*100000)/100000;
    			// Legacy version in operation from November 2014 to August 2015
    			// that did not handle tuplets properly (led to rounding errors).
    			// note.duration = note.offtime - note.ontime;
    			note.tie = tie;
    		}
    		else {
    			// There was not a completion to this tie.
    			console.log('There was not a completion to tied note event ID: '
    									+ note.ID);
    		}
    		notes.push(note);
    	}

    	return notes;
    },

    assoc_grace: function(notes_array, tied_array, grace_array){
    	// Tom Collins 18/2/2015.
      // This function groups an array of grace notes by their ID field, and then
    	// it attaches this group of grace notes to a field of the ordinary note
    	// whose ID field is one greater than the ID field of the final grace note in
    	// each group. In this way, grace notes should be associated with the
    	// appropriate ordinary notes to which they are attached in a score. If a
    	// grace note is associated with a note that ties to subsequent notes, then
    	// the grace field will appear within the tied note object, rather than
    	// directly in the oblong summary.

    	let ga = mu.group_grace_by_contiguous_id(grace_array);
    	for (let gi = 0; gi < ga.length; gi++){
    		let target_ID = parseFloat(ga[gi][ga[gi].length - 1].ID) + 1;
    		let target_idx = mu.array_object_index_of(notes_array, target_ID.toString(), "ID");
    		if (target_idx >= 0){
    			notes_array[target_idx].grace = ga[gi];
    		}
    		else {
    			// Search for the note in the tied array instead.
    			target_idx = mu.array_object_index_of(tied_array, target_ID.toString(), "ID");
    			if (target_idx >= 0){
    				tied_array[target_idx].grace = ga[gi];
    			}
    			else {
    				console.log('Issue whilst assigning grace notes to ordinary notes:');
    				console.log('Could not locate ordinary note with ID: ' + target_ID);
    				console.log('Associated grace note(s) will be omitted from the json_score variable.');
    			}
    		}
    	}
    	return [notes_array, tied_array];
    },

    xml_pitch2pitch_class_and_octave: function(xml_pitch, npo = false){
    	// Tom Collins 24/11/2014.
      // This function converts an array object that contains pitch information
    	// imported directly from a MusicXML file into a string containing the pitch
    	// class of a note and its octave.

    	let step, alter, octave;
      if (npo){
        step = xml_pitch.step[0];
        if (xml_pitch.alter !== undefined){
      		alter = xml_pitch.alter[0];
      	}
        octave = xml_pitch.octave[0];
      }
      else {
        step = xml_pitch.step;
        if (xml_pitch.alter !== undefined){
      		alter = xml_pitch.alter;
      	}
        octave = xml_pitch.octave;
      }
    	let final_pitch;
    	if (alter !== undefined){
        switch(alter){
    			case '-2':
    				final_pitch = step + 'bb' + octave;
    				break;
    			case '-1':
    				final_pitch = step + 'b' + octave;
    				break;
          case '0':
    				final_pitch = step + octave;
    				break;
    			case '1':
    				final_pitch = step + '#' + octave;
    				break;
    			case '2':
    				final_pitch = step + '##' + octave;
    				break;
          default:
            console.log("Er, got to default in alter...");
    		}
    	}
    	else {
    		final_pitch = step + octave;
    	}
    	return final_pitch;
    },

    convert_1st_bar2anacrusis_val: function(bar, divisions){
      // console.log("divisions:", divisions)
      // Time signature
      const xmlTs = bar.find(function(obj){
        return obj.name === "attributes"
      })
      .elements.find(function(obj){
        return obj.name === "time"
      });
      // console.log("xmlTs:", xmlTs)
      const ts = {};
      if (xmlTs !== undefined){
        ts.topNo = parseInt(
          xmlTs.elements.find(function(obj){
            return obj.name === "beats"
          })
          .elements[0].text
        );
        ts.bottomNo = parseInt(
          xmlTs.elements.find(function(obj){
            return obj.name === "beat-type"
          })
          .elements[0].text
        );
      }
      else {
        console.log('It was not possible to find a time signature in the first ' +
                    'bar.');
        console.log('Returning default values for the anacrusis and crotchets '+
                    'per bar, which may be wrong.');
        return [0, 4]
      }
      // console.log("ts:", ts)
      const crotchetsPerBar = 4*ts.topNo/ts.bottomNo;
      // console.log("crotchetsPerBar:", crotchetsPerBar)
      const expectedDur1stBar = divisions*crotchetsPerBar;
      // console.log("expectedDur1stBar:", expectedDur1stBar)

      // Notes by voice
      const xmlNotes = bar.filter(function(obj){
        return obj.name === "note"
      });
      // console.log("xmlNotes:", xmlNotes)
      const noteDursByVoice = {};
      // Filter out grace/cue notes and collect durations by voice.
      xmlNotes
      .filter(function(xn){
        const grace = xn.elements.find(function(el){
          return el.name === "grace"
        });
        const cue = xn.elements.find(function(el){
          return el.name === "cue"
        });
        return !grace && !cue
      })
      .forEach(function(xn, idx){
        const currVoice = xn.elements.find(function(el){
          return el.name === "voice"
        })
        .elements[0].text;
        const currDur = xn.elements.find(function(el){
          return el.name === "duration"
        })
        .elements[0].text;

        // If the note is the first, second,..., (n - 1)th note of an n-
        // note chord, then do not increment these variables. Wait till
        // the nth note.
        if (
          idx < xmlNotes.length - 1 &&
          xmlNotes[idx + 1].elements !== undefined &&
          xmlNotes[idx + 1].elements.find(function(obj){
            return obj.name === "chord"
          })
        );
        else {
          if (noteDursByVoice[currVoice] === undefined){
            noteDursByVoice[currVoice] = [parseInt(currDur)];
          }
          else {
            noteDursByVoice[currVoice].push(parseInt(currDur));
          }
        }
      });
      // console.log("noteDursByVoice:", noteDursByVoice)
      // Add them all up and find the maximum duration across all voices.
      const totals = Object.keys(noteDursByVoice).map(function(k){
        return mu.array_sum(noteDursByVoice[k])
      });
      // console.log("totals:", totals)
      const maxDur = mu.max_argmax(totals)[0];
      // console.log("maxDur:", maxDur)

      if (maxDur < expectedDur1stBar){
        // console.log("Anacrusis!")
        const anacrusis = -maxDur/divisions;
        return [anacrusis, crotchetsPerBar]
      }
      else if (maxDur === expectedDur1stBar){
        // console.log("No anacrusis!")
        return [0, crotchetsPerBar]
      }
      else {
        console.log('Unexpected anacrusis value.');
        console.log('Returning default values for the anacrusis and crotchets '+
                    'per bar, which may be wrong.');
        return [0, 4]
      }
    }

  };

  // Imports
  // import fs
  const fs = require('fs');
  // const { Midi } = require('@tonejs/midi')

  // Constructor for KernImport object
  function KernImport$1(_fpath){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.fpath = _fpath;
    this.data = this.get_data();
    this.lines = this.data.split("\n");
    // console.log("this.lines.slice(0, 50):", this.lines.slice(0, 50))
    // Possible to return something.
    // return sth;
  }
  // Methods for KernImport object
  KernImport$1.prototype = {
    constructor: KernImport$1,

    get_anacrusis: function(){
      const i = this.get_first_duration_index();
      const barAndI = this.get_first_numbered_bar_and_index();
      //
      if (barAndI[0] == 1 && barAndI[1] < i){
        // This kind of situation, where the first bar is labeled and the first
        // line to contain a duration occurs after the first bar.
        // =1	=1	=1	=1
        // 8GG	8r	8r	8B 8g
        // Result is no anacrusis.
        return 0
      }
      else if (barAndI[0] == 1 && barAndI[1] > i){
        // First bar is labeled and the first line to contain a duration occurs
        // before the first bar.
        // 8GG	8r	8r	8B 8g
        // =1	=1	=1	=1
        // Result is anacrusis that needs counting. Sometimes the anacrusis adds
        // up to a whole bar's worth of music, in which case null may still be
        // returned.
        const dur = this.get_duration_between_lines(i, barAndI[1]);
        console.log("dur:", dur);
        const ts = this.get_first_time_signature();
        const crotchetsPerBar = ts[0]*4/ts[1];
        if (dur == crotchetsPerBar){
          return 0
        }
        else if (dur < crotchetsPerBar){
          return dur
        }
        else {
          console.log("Anacrusis appears to be longer than one bar!!");
          return dur
        }
      }
      else if (barAndI[0] == 2){
        // First bar is unlabeled and assumed complete.
        // 2.r	2.r	2dd	2ff
        // .	.	4cc	8ee-
        // .	.	.	16dd
        // .	.	.	16ee-
        // =2	=2	=2	=2
        // 2.r	2f	2b-	2dd
        return 0
      }


    },

    get_data: function(){
      return fs.readFileSync(this.fpath, "utf8")
    },

    get_duration_between_lines: function(idxBgn = 0, idxEnd = this.lines.length){
      let i = idxBgn;
      let dur = 0;
      while(i < idxEnd){
        let line = this.lines[i].split("\t");
        // We only ever look at the first spine, because there must always be at
        // least one spine, and they can't swap so it remains legitimate.
        // Clean token to derive duration.
        let cleanToken = line[0]
        .split(" ")[0] // Gets rid of chordal content, which disrupts dot processing.
        .replace(/\[/g, "").replace(/\(/g, "") // Gets rid of stem and phrase info, which disrupts integer parsing.
        .replace(/&/g, "");
        const intgr = parseInt(cleanToken);
        if (!isNaN(intgr)){
          let val = 4/intgr;
          val = 4/intgr;
          let dotVal = val/2;
          // Handle dots, double dots, etc.
          while (cleanToken.length > 1 && cleanToken.indexOf(".") >= 0){
            val += dotVal;
            dotVal /= 2;
            cleanToken = cleanToken.replace(".", "");
          }
          dur += val;
        }
        i++;
      }
      return dur
    },

    get_first_duration_index: function(){
      let i = 0;
      while(i < this.lines.length){
        let line = this.lines[i].split("\t");
        const cleanToken = line[0].replace(/\[/g, "").replace(/\(/g, "");
        const intgr = parseInt(cleanToken);
        if (!isNaN(intgr)){
          // console.log("line:", line)
          return i
        }
        i++;
      }

    },

    get_first_numbered_bar_and_index: function(){
      let i = 0;
      while(i < this.lines.length){
        let line = this.lines[i].split("\t");
        if (line[0].slice(0, 2) == "=1"){
          // console.log("line:", line)
          return [1, i]
        }
        else if (line[0].slice(0, 2) == "=2"){
          // console.log("line:", line)
          return [2, i]
        }
        i++;
      }
    },

    get_first_time_signature: function(){
      let i = 0;
      while(i < this.lines.length){
        if (this.lines[i].slice(0, 2) == "*M"){
          const justOneTS = this.lines[i].split("\t")[0];
          return justOneTS.replace("*M", "").split("/")
        }
        i++;
      }
    },

    get_midi_data: function(aPath){
      return fs.readFileSync(this.fpath, "utf8")
    },

    get_phrase_boundary_ontimes: function(anacrusis = 0){
      let i = 0;
      let kernIdx;
      let line;
      while (i < this.lines.length && kernIdx == undefined){
        if (this.lines[i].indexOf("**kern") == 0){
          line = this.lines[i].split("**kern");
          kernIdx = i;
          i = this.lines.length - 1;
        }
        i++;
      }
      console.log("line:", line);
      if (line == undefined){
        console.log("COULD NOT FIND START OF KERN SPINES. RETURNING EARLY!");
        return
      }

      // Keep track of incrementing time.
      const nosStaves = line.length - 1;
      let timeIncrArr = new Array(nosStaves);
      let spineIdxArr = new Array(nosStaves);
      line = this.lines[kernIdx].split("\t");
      i = 0;
      for (let k = 0; k < line.length; k++){
        if (line[k] == "**kern"){
          timeIncrArr[i] = [0];
          spineIdxArr[i] = k;
          i++;
        }
      }
      // console.log("timeIncrArr:", timeIncrArr)
      console.log("spineIdxArr:", spineIdxArr);
      let phraseBgnOntimes = [], phraseEndOntimes = [];

      i = kernIdx;
      while(i < this.lines.length){
      // while(i < 100){
        // console.log("i:", i)
        // if (this.lines[i][0] == "="){
        //   console.log("timeIncrArr:", timeIncrArr)
        //   console.log("this.lines[i]:", this.lines[i])
        // }
        if (
          this.lines[i][0] !== "=" &&
          this.lines[i].indexOf("!!!") == -1 &&
          this.lines[i] !== ""
        ){
          line = this.lines[i].split("\t");
          // console.log("line:", line)
          // Check for the presence of a spine-splitting command.
          let spineSplit = line.indexOf("*^");
          if (spineSplit >= 0){
            console.log("line:", line);
            console.log("spineSplit:", spineSplit);
          }


          timeIncrArr = timeIncrArr.map(function(arr, j){
            return arr.map(function(el){
              const token = line[spineIdxArr[j]];
              // console.log("token:", token)
              // Check for phrase beginning and ending.
              const elRnd = Math.round(10000*(el - anacrusis))/10000;
              if (
                token.indexOf("(") >= 0 &&
                token.indexOf("q") == -1 &&
                phraseBgnOntimes.indexOf(elRnd) == -1
              ){
                phraseBgnOntimes.push(elRnd);
              }
              if (
                token.indexOf(")") >= 0 &&
                token.indexOf("q") == -1 &&
                phraseEndOntimes.indexOf(elRnd) == -1
              ){
                phraseEndOntimes.push(elRnd);
              }

              // Clean token to derive duration.
              let cleanToken = token
              .split(" ")[0] // Gets rid of chordal content, which disrupts dot processing.
              .replace(/\[/g, "").replace(/\(/g, "") // Gets rid of stem and phrase info, which disrupts integer parsing.
              .replace(/&/g, "");
              const intgr = parseInt(cleanToken);
              let val = 0;
              if (!isNaN(intgr)){
                val = 4/intgr;
                let dotVal = val/2;
                // Handle dots, double dots, etc.
                while (cleanToken.length > 1 && cleanToken.indexOf(".") >= 0){
                  val += dotVal;
                  // console.log("token:", token)
                  // console.log("val:", val)
                  dotVal /= 2;
                  cleanToken = cleanToken.replace(".", "");
                }
              }
              // console.log("val:", val)
              return el + val
            })
          });
        }
        i++;
      }
      console.log("timeIncrArr:", timeIncrArr);
      // console.log("phraseBgnOntimes:", phraseBgnOntimes)
      // console.log("phraseEndOntimes:", phraseEndOntimes)
      return {
        "timeIncrArr": timeIncrArr,
        "phraseBgnOntimes": phraseBgnOntimes,
        "phraseEndOntimes": phraseEndOntimes
      }

    }


  };

  /**
   * @file Welcome to the API for MAIA Markov!
   *
   * MAIA Markov is a JavaScript package used by Music Artificial Intelligence
   * Algorithms, Inc. in various applications that we have produced or are
   * developing currently.
   *
   * If you already know about JavaScript app development and music computing,
   * then probably the best starting point is the
   * [NPM package](https://npmjs.com/package/maia-markov/).
   *
   * If you have a music computing background but know little about JavaScript,
   * then the tutorials menu is a good place to start. There are also some
   * fancier-looking demos available
   * [here](http://tomcollinsresearch.net/mc/ex/),
   * some of which involve MAIA Markov methods to some degree.
   *
   * If you don't know much about music or music computing, then the
   * [fancier-looking demos](http://tomcollinsresearch.net/mc/ex/) are still the
   * best place to start, to get hooked on exploring web-based, interactive music
   * interfaces.
   *
   * This documentation is in the process of being completed. Some functions have
   * not had their existing documentation converted to JSDoc format yet.
   *
   * @version 0.1.4
   * @author Tom Collins and Christian Coulon
   * @copyright 2015-2024
   *
   */


  const PatternGenerator = PatternGenerator$1;
  const Analyzer = Analyzer$1;
  const Generator = Generator$1;
  const KeyValuePair = KeyValuePair$1;
  const Vertex = Vertex$1;
  const Edge = Edge$1;
  const Heap = Heap$1;
  const PriorityQueue = PriorityQueue$1;
  const Graph = Graph$1;
  const MidiImport = MidiImport$1;
  const MidiExport = MidiExport$1;
  const XmlImport = XmlImport$1;
  const KernImport = KernImport$1;

  var maiaMarkov = {
    PatternGenerator,
    Analyzer,
    Generator,
    KeyValuePair,
    Vertex,
    Edge,
    Heap,
    PriorityQueue,
    Graph,
    MidiImport,
    MidiExport,
    XmlImport,
    KernImport

  };

  return maiaMarkov;

})();
