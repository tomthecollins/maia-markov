// Imports
const mu = require('maia-util')
// import 'maia-util'
// import mu from 'maia-util'

// Constructor for Generator object
export default function Generator(){
  // Workaround for JS context peculiarities.
  // var self = this;
  // Possible to return something.
  // return sth;
}
// Methods for Generator object
Generator.prototype = {
  constructor: Generator,

  // Tom Collins 6/4/2016.
  // Defining a modulo function because by default the modulus of a negative
  // number in javascript is negative.
  mod: function(a, n){
    return a - (n*Math.floor(a/n))
  },

  get_lyrics_from_states: function(stateContextPairs, param){
    const stateType = param.stateType
    // Make a fresh copy because I was getting some weird-ass problems with idx.
    let scp = JSON.parse(JSON.stringify(stateContextPairs))
    // console.log("scp:", scp)
    // Unpack states into a string.
    console.log("scp[0]:", scp[0])
    let lyrics = ""
    scp.forEach(function(s){
      lyrics += s[stateType][0] + " "
    })
    lyrics += scp[scp.length - 1][stateType][1]
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
    const self = this
    const stateType = param.stateType
    const pointReconstruction = param.pointReconstruction
    const currTimeSig = param.timeSignatures[0]
    const crotchetBeatsInBar = 4*currTimeSig.topNo/currTimeSig.bottomNo
    const idxOn = param.indices.ontime
    const idxMNN = param.indices.MNN
    const idxMPN = param.indices.MPN
    const idxDur = param.indices.duration
    const idxChan = param.indices.channel
    const idxVel = param.indices.velocity
    // stateContextPairs, stateType = "beat_rel_sq_MNN_state",
    // currentTimeSignature = { "topNo": 4, "bottomNo": 4 }
    // const idxOn = 0, idxMNN = 1, idxMPN = 2, idxDur = 3, idxChan = 4, idxVel = 5
    // var crotchetBeatsInBar = 4*currentTimeSignature.topNo/currentTimeSignature.bottomNo;

    // Make a fresh copy because I was getting some weird-ass problems with idx.
    let scp = JSON.parse(JSON.stringify(stateContextPairs))
    // console.log("scp:", scp)
    // Unpack states into MNNs and MPNs.
    scp.forEach(function(s){
      let MNNs = []
      let MPNs = []
      s.context.orig_points.forEach(function(p){
        const mnnMpnPair = self.state_representation_of_pitch(
          [p[idxMNN], p[idxMPN]], param, s.context.tonic_pitch_closest
        )
        MNNs.push(mnnMpnPair[0])
        MPNs.push(mnnMpnPair[1])
      })
      s.MNNs = MNNs;
      s.MPNs = MPNs;
    })

    // Get the ontimes for each state.
    let ons = self.state_ontimes(scp, stateType, crotchetBeatsInBar)
    scp.map(function(s, idx){
      s.ontime = ons[idx]
    })

    // Dovetail durations.
    scp = self.dovetail_durations(scp, param)
    // console.log("scp:", scp)

    // Define points.
    let points = []
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
          ])
        }
      })
    })
    return points.sort(mu.lex_more)
  },

  dovetail_durations: function(stateContextPairs, param){
    const stateType = param.stateType
    const idxOn = param.indices.ontime
    const idxMNN = param.indices.MNN
    const idxMPN = param.indices.MPN
    const idxDur = param.indices.duration
    const idxChan = param.indices.channel
    const idxVel = param.indices.velocity
    // Get a last offtime.
    // This is the ontime at which the final selected state began in the original
    // piece.
    const ontimeOfLastState = mu.max_argmax(
      stateContextPairs[stateContextPairs.length - 1].context.orig_points.map(function(p){
        return p[idxOn]
      })
    )[0]
    // This is the maximum offtime of a note in that state.
    const offtimeOfLastState = mu.max_argmax(
      stateContextPairs[stateContextPairs.length - 1].context.orig_points.map(function(p){
        return p[idxOn] + p[idxDur]
      })
    )[0]
    // The difference between these two,
    // offtimeOfLastState - ontimeOfLastState,
    // will give us an acceptable value for an offtime for the final selected
    // state in the new context, when added to the ontime for the final selected
    // state.
    const lastOfftime = stateContextPairs[stateContextPairs.length - 1].ontime +
    offtimeOfLastState - ontimeOfLastState
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
      s.durations = new Array(s.context.orig_points.length)
      s.dovetailed = new Array(s.context.orig_points.length)
      s.context.orig_points.map(function(p, idx){
        s.durations[idx] = 0
        s.dovetailed[idx] = false
      })
    })
    stateContextPairs.map(function(s, idx){
      // console.log("s['beat_MNN_state']:", s['beat_MNN_state'])
      // Ontime where state began in original context.
      const ontimeOfState = mu.max_argmax(
        s.context.orig_points.map(function(p){
          return p[idxOn]
        })
      )[0]
      // console.log("ontimeOfState:", ontimeOfState)
      // Durations left in state
      // console.log("orig_points:", s.context.orig_points)
      const dlis = s.context.orig_points.map(function(p){
        return p[idxOn] + p[idxDur] - ontimeOfState
      })
      // console.log("dlis:", dlis)
      // These are the durations we will assign to each note (is parallel with
      // the MNNs and MPNs properties, which should be present).
      s.context.orig_points.map(function(p, kdx){
        // Stands for map into index.
        const mii = s.context.map_into_state[kdx]
        // const m = p[idxMNN]
        // console.log("m:", m)
        // Have a look in the next state.
        let jdx = idx + 1
        while (jdx <= stateContextPairs.length){
          let compareOntime, lins
          // Need to be careful about end case, where jdx == stateContextPairs.length
          if (jdx < stateContextPairs.length){
            // Where this next state begins in new context.
            // console.log("Regular case. jdx = " + jdx + ", stateContextPairs[jdx]:", stateContextPairs[jdx])
            compareOntime = stateContextPairs[jdx].ontime
            // Stands for "look in next state". Is this "pitch" present?
            //***********************************************
            // 26.02.2020. FIXED FOR DIFFERENT STATE TYPES! *
            //***********************************************
            lins = stateContextPairs[jdx][stateType][1]
            .indexOf(s[stateType][1][mii])
          }
          else {
            // End case.
            // console.log("End case")
            compareOntime = lastOfftime // Use value calculated above.
            lins = -1 // Nothing to look for.
          }
          // console.log("compareOntime:", compareOntime, "lins:", lins)

          if (dlis[kdx] <= compareOntime - stateContextPairs[jdx - 1].ontime){
            // Case (A)
            // console.log("Case (A)")
            s.durations[kdx] += dlis[kdx]
            jdx = stateContextPairs.length
          }
          else if (lins == -1){
            // Case (B)
            // console.log("Case (B)")
            s.durations[kdx] += compareOntime - stateContextPairs[jdx - 1].ontime
            jdx = stateContextPairs.length
          }
          else {
            // Case (C)
            // console.log("Case (C)")
            s.durations[kdx] += compareOntime - stateContextPairs[jdx - 1].ontime
            stateContextPairs[jdx].dovetailed[lins] = true
            // s.dovetailed[kdx] = true
          }
          jdx++
        }
      })
      // console.log("s.durations:", s.durations, "s.dovetailed:", s.dovetailed)
    })
    return stateContextPairs
  },

  state_ontimes: function(
    stateContextPairs, stateType = "beat_rel_sq_MNN_state", crotchetBeatsInBar = 4
  ){
    const self = this
    let interStateDurations = stateContextPairs.map(function(s, idx){
      if (idx > 0){
        let d = s[stateType][0] - stateContextPairs[idx - 1][stateType][0]
        if (d < 0){
          d = mu.mod(d, crotchetBeatsInBar)
        }
        else if (d == 0){
          d = crotchetBeatsInBar
        }
        return d
      }
    })
    // console.log("interStateDurations:", interStateDurations)
    interStateDurations = interStateDurations.slice(1)
    const ontimes = new Array(stateContextPairs.length)
    ontimes[0] = stateContextPairs[0][stateType][0] - 1
    interStateDurations.map(function(isd, idx){
      ontimes[idx + 1] = ontimes[idx] + isd
    })
    // console.log("ontimes:", ontimes)
    return ontimes
  },

  state_representation_of_pitch: function(midiMorphPair, param, tpc){
    const pointReconstruction = param.pointReconstruction
    const squashRange = param.squashRangeMidiMorph
    let mnn = midiMorphPair[0], mpn = midiMorphPair[1]
    switch (pointReconstruction){
      case "rel_sq_MNN":
      // Remove tonic pitch closest.
      mnn -= tpc[0]
      mpn -= tpc[1]
      // Squash.
      while (mnn > squashRange[0] || mnn < -squashRange[0]){
        if (mnn > squashRange[0]){
          mnn -= squashRange[0]
          mpn -= squashRange[1]
        }
        else {
          mnn += squashRange[0]
          mpn += squashRange[1]
        }
      }
      break
      case "rel_MNN":
      // Remove tonic pitch closest.
      mnn -= tpc[0]
      mpn -= tpc[1]
      break
      case "MNN":
      // No manipulation required.
      break
      default:
      console.log("SHOULD NOT GET HERE!")
    }
    return [mnn, mpn]
  },

  get_suggestion: function(param){
    const stateType = param.stateType
    const stm = param.stm
    const initial = param.initial
    const nosConsecutives = param.nosConsecutives
    const ontimeUpperLimit = param.ontimeUpperLimit
    let randCount = param.randCount
    const idxOn = param.indices.ontime
    // const defaultTimeSig = { "topNo": 4, "bottomNo": 4 }
    // console.log('stm[0][' + stateType + ']:', stm[0][stateType]);
    // console.log('stm[5][' + stateType + ']:', stm[5][stateType]);

    // Either take an initial provided state, choose one from the provided initial
    // distribution, or choose one from beat 1 of the stm.
    if (initial !== null){
      // It's an initial provided state or an initial distribution.
      if (initial[stateType] !== undefined){
        // It's an initial provided state.
        var lkState = initial
      }
      else {
        // It's an initial distribution.
        var lkState = mu.choose_one(initial)
        randCount++
      }
    }
    else {
      // Choose an initial state from beat 1 of the stm.
      var lkState = mu.choose_one(
        stm.filter(function(sc){
          return sc[stateType][0] == 1
        })
      )//[stateType]
      randCount++
    }
    // console.log("lkState:", lkState)
    let lastOntime = lkState[stateType][0] - 1
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
    let stateCtxPairs = [lkState], points
    lkState = lkState[stateType]
    // console.log("stateCtxPairs:", stateCtxPairs)
    // var nSt = 40; // This is the number of continuations.
    // for (iSt = 0; iSt < nSt; iSt++){
    while (lastOntime <= ontimeUpperLimit){
      var relIdx = mu.array_object_index_of_array(stm, lkState, stateType);
      // console.log('relIdx:', relIdx);
      if (relIdx == -1){
        console.log("Early stop: state was not found in the stm.")
        break
        // return
        // Choose a state at random.
        // relIdx = mu.get_random_int(0, stm.length);
        // console.log('rand populated relIdx:', relIdx);
      }
      // Use it to grab continuations and pick one at random.
      var conts = stm[relIdx].continuations;
      // console.log('stm[relIdx][stateType]:', stm[relIdx][stateType], 'conts.length:', conts.length);
      var currCont = mu.choose_one(conts);
      randCount++
      stateCtxPairs.push(currCont);

      points = this.get_points_from_states(stateCtxPairs, param)
      lastOntime = points[points.length - 1][idxOn]

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
    const stateType = param.stateType
    const stm = param.stm
    const initial = param.initial
    const nosConsecutives = param.nosConsecutives
    const wordLimit = param.wordLimit
    let randCount = param.randCount
    // const defaultTimeSig = { "topNo": 4, "bottomNo": 4 }
    console.log('stm[0][' + stateType + ']:', stm[0][stateType]);
    console.log('stm[5][' + stateType + ']:', stm[5][stateType]);

    // Either take an initial provided state, choose one from the provided initial
    // distribution, or choose one from beat 1 of the stm.
    if (initial !== null){
      // It's an initial provided state or an initial distribution.
      if (initial[stateType] !== undefined){
        // It's an initial provided state.
        var lkState = initial
      }
      else {
        // It's an initial distribution.
        var lkState = mu.choose_one(initial)
        randCount++
      }
    }
    else {
      // Choose an initial state from beat 1 of the stm.
      var lkState = mu.choose_one(
        stm.filter(function(sc){
          return sc.context.index_in_line == 0
        })
      )//[stateType]
      randCount++
    }
    console.log("lkState:", lkState)
    let nosWords = 1

    // Use lkState and subsequent continuations to query the stm.
    let stateCtxPairs = [lkState], words
    lkState = lkState[stateType]
    console.log("stateCtxPairs:", stateCtxPairs)
    while (nosWords <= wordLimit){
      var relIdx = mu.array_object_index_of_array(stm, lkState, stateType);
      console.log('relIdx:', relIdx);
      if (relIdx == -1){
        console.log("Early stop: state was not found in the stm.")
        break
      }
      // Use it to grab continuations and pick one at random.
      var conts = stm[relIdx].continuations;
      console.log('stm[relIdx][stateType]:', stm[relIdx][stateType], 'conts.length:', conts.length);
      var currCont = mu.choose_one(conts);
      randCount++
      stateCtxPairs.push(currCont);

      words = get_lyrics_from_states(stateCtxPairs, param)
      nosWords++

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

}
