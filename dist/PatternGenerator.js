'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PatternGenerator;

var _Analyzer = require('./Analyzer');

var _Analyzer2 = _interopRequireDefault(_Analyzer);

var _Generator = require('./Generator');

var _Generator2 = _interopRequireDefault(_Generator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Imports
var mu = require('maia-util');
// import { state2string, string2state } from './Analyzer'

// import get_points_from_states from './Generator'

// Constructor for PatternGenerator object
function PatternGenerator(_onBgn, _onEnd, _midiBgn, _trans) {
  // Workaround for JS context peculiarities.
  // var self = this;
  this.onBgn = _onBgn; // Ontime of first segment of first occurrence.
  this.onEnd = _onEnd; // Ontime of last segment of first occurrence.
  this.midiBgn = _midiBgn; // MIDI note of lowest note in first segment.
  this.trans = _trans; // Translation vectors for all occurrences of the pattern.
  this.an = new _Analyzer2.default();
  this.gn = new _Generator2.default();
  // Possible to return something.
  // return sth;
}
// Methods for PatternGenerator object
PatternGenerator.prototype = {
  constructor: PatternGenerator,

  generate_with_shortest_path: function generate_with_shortest_path(nCand, param) {
    var self = this;
    // Shorten a few parameters names.
    var stateType = param.stateType;
    var g = param.graph;
    var idxOn = param.indices.ontime;

    // Iterate until we have enough candidates.
    var stateSequences = new Array(nCand);
    var iCand = 0,
        nosAttempts = 1;

    // Set initial and final states.
    var initialObj = this.get_initial("initial", param);
    param.randCount = initialObj.randCount;
    var initialScPair = initialObj.stateContextPair;
    var finalObj = this.get_initial("final", param);
    param.randCount = finalObj.randCount;
    var finalScPair = finalObj.stateContextPair;

    // Does a (shortest) path exist between initial and final?
    var initialStr = self.an.state2string(initialScPair[stateType]);
    // console.log("initialStr:", initialStr)
    var finalStr = self.an.state2string(finalScPair[stateType]);
    // console.log("finalStr:", finalStr)
    var shortPath = g.print_shortest_path(initialStr, finalStr);
    if (shortPath !== undefined) {
      stateSequences[iCand] = shortPath;
      iCand++;
    }
    // To get up to the number of candidates we need, allow freedom in new
    // "final" state and "initial" state partway through the requested passage.
    while (iCand < nCand) {
      // Set the "free" initial and final states.
      var initialFreeObj = this.get_initial("initial", param);
      param.randCount = initialFreeObj.randCount;
      var initialFreeScPair = initialFreeObj.stateContextPair;
      var finalFreeObj = this.get_initial("final", param);
      param.randCount = finalFreeObj.randCount;
      var finalFreeScPair = finalFreeObj.stateContextPair;
      // Do shortest paths exist?
      var initialFreeStr = self.an.state2string(initialFreeScPair[stateType]);
      // console.log("initialFreeStr:", initialFreeStr)
      var finalFreeStr = self.an.state2string(finalFreeScPair[stateType]);
      // console.log("finalFreeStr:", finalFreeStr)
      var shortPathA = g.print_shortest_path(initialStr, finalFreeStr);
      // console.log("shortPathA:", shortPathA)
      var shortPathB = g.print_shortest_path(initialFreeStr, finalStr);
      // console.log("shortPathB:", shortPathB)
      if (shortPathA !== undefined && shortPathB !== undefined) {
        stateSequences[iCand] = shortPathA.concat(shortPathB);
        iCand++;
      }
      nosAttempts++;
    }
    // console.log("stateSequences:", stateSequences)

    // Convert to state-context pairs.
    var scPairSequences = stateSequences.map(function (ss) {
      return self.state_sequence2state_context_pairs(ss, param);
    });
    var pointSets = scPairSequences.map(function (scPairInfo) {
      return self.gn.get_points_from_states(scPairInfo.stateContextPairs, param);
    });
    // let metrics = self.get_metrics(pointSets)
    // let estStylisticSuccess = self.estimate_stylistic_success(pointSets, metrics)
    var psMetrics = pointSets.map(function (ps, idx) {
      return {
        "pointSet": ps,
        "stateCtxPairs": scPairSequences[idx].stateContextPairs
        // "metrics": metrics[idx],
        // "estStylisticSuccess": estStylisticSuccess[idx]
      };
    });
    // .sort(function(a, b){
    //   return a.estStylisticSuccess - b.estStylisticSuccess
    // })
    return {
      "randCount": param.randCount,
      'nosAttempts': nosAttempts,
      "psMetrics": psMetrics
    };
  },

  exampleDiscPatt: [{
    "label": "A",
    "otherProperties": "here",
    "translators": [[0, 0], [12, 0], [28, 0], [40, 0]],
    "occurrences": [{
      "label": "A0",
      "ontimeBgn": 0,
      "ontimeEnd": 8,
      "subsetScore": 1
    }, {
      "label": "A1",
      "ontimeBgn": 12,
      "ontimeEnd": 20,
      "subsetScore": 1
    }, {
      "label": "A2",
      "ontimeBgn": 28,
      "ontimeEnd": 36,
      "subsetScore": 1
    }, {
      "label": "A3",
      "ontimeBgn": 40,
      "ontimeEnd": 48,
      "subsetScore": 1
    }]
  }, {
    "label": "B",
    "otherProperties": "here",
    "translators": [[0, 0], [28, 0]],
    "occurrences": [{
      "label": "B0",
      "ontimeBgn": 0,
      "ontimeEnd": 24,
      "subsetScore": 0
    }, {
      "label": "B1",
      "ontimeBgn": 28,
      "ontimeEnd": 52,
      "subsetScore": 0
    }]
  }],

  generate_with_patterns: function generate_with_patterns(discoveredPatterns, param) {
    var self = this;
    var ontimeWindow = [0, 64];
    var winsAddressed = [];
    // Calculate max subset scores.
    discoveredPatterns.forEach(function (dp) {
      dp.maxArgmaxSubsetScore = mu.max_argmax(dp.occurrences.map(function (o) {
        return o.subsetScore;
      }));
    });
    // Sort by max subset score.
    discoveredPatterns = discoveredPatterns.sort(function (x, y) {
      // DOUBLE-CHECK THIS!
      return x.maxArgmaxSubsetScore[0] - y.maxArgmaxSubsetScore[0];
    });
    // Go through each occurrence of each pattern and see if we can address it.
    discoveredPatterns.forEach(function (dp) {
      // Address the occurrence that received the maximum subset score.
      var occ = dp.occurrences[dp.maxArgmaxSubsetScore[1]];
      // If we take the example of B0, when we come to it, winsAddressed will
      // already look like this:
      // [[0, 8], [12, 20], [28, 36], [40, 48]]
      // and we'll want the output of generate_time_windows() to be
      // [[8, 12], [20, 28]],
      // acknwoledging that these are the time windows belonging to B0 that
      // still need to be addressed.
      var winsToAddress = self.generate_time_windows(o.ontimeBgn, o.ontimeEnd, winsAddressed);

      // Generate content for these time windows.

      // Paste new content to time windows corresponding to translations of this
      // pattern (other occurrences),
    });

    // Generate for time windows that remain unaddressed because they do not
    // feature in any pattern occurrences.

  },

  get_initial: function get_initial(strRequest, aParam) {
    console.log("strRequest:", strRequest);
    var stateType = aParam.stateType;
    var randCount = aParam.randCount;
    var stateCtxPair = void 0;

    if (aParam[strRequest] !== null) {
      // It's an initial provided state or an initial distribution.
      if (aParam[strRequest][stateType] !== undefined) {
        // It's an initial provided state.
        stateCtxPair = aParam[strRequest][stateType];
      } else {
        // It's an initial distribution.
        stateCtxPair = mu.choose_one(aParam[strRequest]);
        randCount++;
      }
    } else {
      // Choose an initial state from beat 1 of the stm.
      stateCtxPair = mu.choose_one(aParam.stm.filter(function (sc) {
        return sc[stateType][0] == 1;
      }));
      randCount++;
    }

    return {
      "randCount": randCount,
      "stateContextPair": stateCtxPair
    };
  },

  state_sequence2state_context_pairs: function state_sequence2state_context_pairs(stateSeq, aParam) {
    var self = this;
    var stateType = aParam.stateType;
    var randCount = aParam.randCount;
    var stateCtxPairs = stateSeq.map(function (stateStr, idx) {
      console.log("idx:", idx);
      var state = self.an.string2state(stateStr);
      // Locate the state.
      if (idx == 0) {
        // Edge case
        var relIdx = mu.array_object_index_of_array(aParam.initial, state, stateType);
        return aParam.initial[relIdx];
      } else if (idx == stateSeq.length - 1) {
        // Edge case
        var _relIdx = mu.array_object_index_of_array(aParam.final, state, stateType);
        return aParam.final[_relIdx];
      } else {
        // Usual case
        // Locate previous state in stm. Then choose from among potentially many
        // continuations with the appropriate state.
        var _relIdx2 = mu.array_object_index_of_array(aParam.stm, self.an.string2state(stateSeq[idx - 1]), stateType);
        console.log("relIdx:", _relIdx2);
        var candCont = aParam.stm[_relIdx2].continuations.filter(function (cont) {
          // console.log("cont[stateType]:", cont[stateType])
          return cont[stateType].equals(state);
        });
        randCount++;
        return mu.choose_one(candCont);
      }
    })
    // When allowing freedom in concatenating two shortest paths, one ending in
    // state A and the other beginning in state B, it is unlikely that B is
    // among the continuations of A, so an undefined value will have crept in,
    // which is removed here.
    .filter(function (scp) {
      return scp !== undefined;
    });
    // console.log("stateCtxPairs from state_sequence2state_context_pairs():", stateCtxPairs)

    return {
      "randCount": randCount,
      "stateContextPairs": stateCtxPairs
    };
  }

};