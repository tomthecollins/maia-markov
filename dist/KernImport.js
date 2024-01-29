"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KernImport;
// Imports
// import fs
var fs = require('fs');
// const { Midi } = require('@tonejs/midi')

// Constructor for KernImport object
function KernImport(_fpath) {
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
KernImport.prototype = {
  constructor: KernImport,

  get_anacrusis: function get_anacrusis() {
    var i = this.get_first_duration_index();
    var barAndI = this.get_first_numbered_bar_and_index();
    //
    if (barAndI[0] == 1 && barAndI[1] < i) {
      // This kind of situation, where the first bar is labeled and the first
      // line to contain a duration occurs after the first bar.
      // =1	=1	=1	=1
      // 8GG	8r	8r	8B 8g
      // Result is no anacrusis.
      return 0;
    } else if (barAndI[0] == 1 && barAndI[1] > i) {
      // First bar is labeled and the first line to contain a duration occurs
      // before the first bar.
      // 8GG	8r	8r	8B 8g
      // =1	=1	=1	=1
      // Result is anacrusis that needs counting. Sometimes the anacrusis adds
      // up to a whole bar's worth of music, in which case null may still be
      // returned.
      var dur = this.get_duration_between_lines(i, barAndI[1]);
      console.log("dur:", dur);
      var ts = this.get_first_time_signature();
      var crotchetsPerBar = ts[0] * 4 / ts[1];
      if (dur == crotchetsPerBar) {
        return 0;
      } else if (dur < crotchetsPerBar) {
        return dur;
      } else {
        console.log("Anacrusis appears to be longer than one bar!!");
        return dur;
      }
    } else if (barAndI[0] == 2) {
      // First bar is unlabeled and assumed complete.
      // 2.r	2.r	2dd	2ff
      // .	.	4cc	8ee-
      // .	.	.	16dd
      // .	.	.	16ee-
      // =2	=2	=2	=2
      // 2.r	2f	2b-	2dd
      return 0;
    }
  },

  get_data: function get_data() {
    return fs.readFileSync(this.fpath, "utf8");
  },

  get_duration_between_lines: function get_duration_between_lines() {
    var idxBgn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var idxEnd = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.lines.length;

    var i = idxBgn;
    var dur = 0;
    while (i < idxEnd) {
      var line = this.lines[i].split("\t");
      // We only ever look at the first spine, because there must always be at
      // least one spine, and they can't swap so it remains legitimate.
      // Clean token to derive duration.
      var cleanToken = line[0].split(" ")[0] // Gets rid of chordal content, which disrupts dot processing.
      .replace(/\[/g, "").replace(/\(/g, "") // Gets rid of stem and phrase info, which disrupts integer parsing.
      .replace(/&/g, "");
      var intgr = parseInt(cleanToken);
      if (!isNaN(intgr)) {
        var val = 4 / intgr;
        val = 4 / intgr;
        var dotVal = val / 2;
        // Handle dots, double dots, etc.
        while (cleanToken.length > 1 && cleanToken.indexOf(".") >= 0) {
          val += dotVal;
          dotVal /= 2;
          cleanToken = cleanToken.replace(".", "");
        }
        dur += val;
      }
      i++;
    }
    return dur;
  },

  get_first_duration_index: function get_first_duration_index() {
    var i = 0;
    var line = void 0;
    while (i < this.lines.length) {
      var _line = this.lines[i].split("\t");
      var cleanToken = _line[0].replace(/\[/g, "").replace(/\(/g, "");
      var intgr = parseInt(cleanToken);
      if (!isNaN(intgr)) {
        // console.log("line:", line)
        return i;
      }
      i++;
    }
  },

  get_first_numbered_bar_and_index: function get_first_numbered_bar_and_index() {
    var i = 0;
    var line = void 0;
    while (i < this.lines.length) {
      var _line2 = this.lines[i].split("\t");
      if (_line2[0].slice(0, 2) == "=1") {
        // console.log("line:", line)
        return [1, i];
      } else if (_line2[0].slice(0, 2) == "=2") {
        // console.log("line:", line)
        return [2, i];
      }
      i++;
    }
  },

  get_first_time_signature: function get_first_time_signature() {
    var i = 0;
    while (i < this.lines.length) {
      if (this.lines[i].slice(0, 2) == "*M") {
        var justOneTS = this.lines[i].split("\t")[0];
        return justOneTS.replace("*M", "").split("/");
      }
      i++;
    }
  },

  get_midi_data: function get_midi_data(aPath) {
    return fs.readFileSync(this.fpath, "utf8");
  },

  get_phrase_boundary_ontimes: function get_phrase_boundary_ontimes() {
    var anacrusis = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var i = 0;
    var kernIdx = void 0;
    var line = void 0;
    while (i < this.lines.length && kernIdx == undefined) {
      if (this.lines[i].indexOf("**kern") == 0) {
        line = this.lines[i].split("**kern");
        kernIdx = i;
        i = this.lines.length - 1;
      }
      i++;
    }
    console.log("line:", line);
    if (line == undefined) {
      console.log("COULD NOT FIND START OF KERN SPINES. RETURNING EARLY!");
      return;
    }

    // Keep track of incrementing time.
    var nosStaves = line.length - 1;
    var timeIncrArr = new Array(nosStaves);
    var spineIdxArr = new Array(nosStaves);
    line = this.lines[kernIdx].split("\t");
    i = 0;
    for (var k = 0; k < line.length; k++) {
      if (line[k] == "**kern") {
        timeIncrArr[i] = [0];
        spineIdxArr[i] = k;
        i++;
      }
    }
    // console.log("timeIncrArr:", timeIncrArr)
    console.log("spineIdxArr:", spineIdxArr);
    var phraseBgnOntimes = [],
        phraseEndOntimes = [];

    i = kernIdx;
    while (i < this.lines.length) {
      // while(i < 100){
      // console.log("i:", i)
      // if (this.lines[i][0] == "="){
      //   console.log("timeIncrArr:", timeIncrArr)
      //   console.log("this.lines[i]:", this.lines[i])
      // }
      if (this.lines[i][0] !== "=" && this.lines[i].indexOf("!!!") == -1 && this.lines[i] !== "") {
        line = this.lines[i].split("\t");
        // console.log("line:", line)
        // Check for the presence of a spine-splitting command.
        var spineSplit = line.indexOf("*^");
        if (spineSplit >= 0) {
          console.log("line:", line);
          console.log("spineSplit:", spineSplit);
        }

        timeIncrArr = timeIncrArr.map(function (arr, j) {
          return arr.map(function (el) {
            var token = line[spineIdxArr[j]];
            // console.log("token:", token)
            // Check for phrase beginning and ending.
            var elRnd = Math.round(10000 * (el - anacrusis)) / 10000;
            if (token.indexOf("(") >= 0 && token.indexOf("q") == -1 && phraseBgnOntimes.indexOf(elRnd) == -1) {
              phraseBgnOntimes.push(elRnd);
            }
            if (token.indexOf(")") >= 0 && token.indexOf("q") == -1 && phraseEndOntimes.indexOf(elRnd) == -1) {
              phraseEndOntimes.push(elRnd);
            }

            // Clean token to derive duration.
            var cleanToken = token.split(" ")[0] // Gets rid of chordal content, which disrupts dot processing.
            .replace(/\[/g, "").replace(/\(/g, "") // Gets rid of stem and phrase info, which disrupts integer parsing.
            .replace(/&/g, "");
            var intgr = parseInt(cleanToken);
            var val = 0;
            if (!isNaN(intgr)) {
              val = 4 / intgr;
              var dotVal = val / 2;
              // Handle dots, double dots, etc.
              while (cleanToken.length > 1 && cleanToken.indexOf(".") >= 0) {
                val += dotVal;
                // console.log("token:", token)
                // console.log("val:", val)
                dotVal /= 2;
                cleanToken = cleanToken.replace(".", "");
              }
            }
            // console.log("val:", val)
            return el + val;
          });
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
    };
  }

};