'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MidiExport;
// Imports
// import fs
var fs = require('fs');

var _require = require('@tonejs/midi'),
    Midi = _require.Midi;

var mu = require('maia-util');

// Constructor for MidiExport object
function MidiExport(_points, _controlChanges, _fpath) {
  var _param = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
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
  };

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
  if (_param.ccIndices) {
    this.ccIndices.ontimeIndex = _param.ccIndices.ontimeIndex;
    this.ccIndices.numberIndex = _param.ccIndices.numberIndex;
    this.ccIndices.channelIndex = _param.ccIndices.channelIndex;
    this.ccIndices.valueIndex = _param.ccIndices.valueIndex;
  }
  this.my_export();
  // Possible to return something.
  // return sth;
}
// Methods for MidiExport object
MidiExport.prototype = {
  constructor: MidiExport,

  my_export: function my_export() {
    var self = this;
    var ontimeCorrection = 0;
    var minOntime = mu.min_argmin(self.points.map(function (p) {
      return p[self.ontimeIndex];
    }))[0];
    if (minOntime < 0) {
      ontimeCorrection = 4 * self.timeSigtopNo / self.timeSigBottomNo;
    }

    // Organise the points and control changes according to their channel numbers.
    var pointsByChan = [];
    var ccByChan = [];
    self.points.forEach(function (p) {
      if (pointsByChan[p[self.noteIndices.channelIndex]] === undefined) {
        pointsByChan[p[self.noteIndices.channelIndex]] = [p];
      } else {
        pointsByChan[p[self.noteIndices.channelIndex]].push(p);
      }
    });
    if (self.controlChanges !== null) {
      self.controlChanges.forEach(function (cc) {
        if (ccByChan[cc[self.ccIndices.channelIndex]] === undefined) {
          ccByChan[cc[self.ccIndices.channelIndex]] = [cc];
        } else {
          ccByChan[cc[self.ccIndices.channelIndex]].push(cc);
        }
      });
    }

    var midi = new Midi();
    // "Works" but actually changes nothing!:
    // midi.header.setTempo(240)
    // console.log("midi.header:", midi.header)
    var ntracks = Math.max(pointsByChan.length, ccByChan.length);

    var _loop = function _loop(i) {
      var track = midi.addTrack();
      track["channel"] = i;
      if (pointsByChan[i] !== undefined) {
        pointsByChan[i].forEach(function (p) {
          track.addNote({
            midi: p[self.noteIndices.mnnIndex],
            time: self.scaleFactor * (p[self.noteIndices.ontimeIndex] + ontimeCorrection),
            duration: self.scaleFactor * p[self.noteIndices.durationIndex],
            velocity: p[self.noteIndices.velocityIndex]
          });
        });
      }
      if (ccByChan[i] !== undefined) {
        ccByChan[i].forEach(function (cc) {
          track.addCC({
            number: cc[self.ccIndices.numberIndex],
            time: self.scaleFactor * (cc[self.ccIndices.ontimeIndex] + ontimeCorrection),
            value: cc[self.ccIndices.valueIndex]
          });
        });
      }
    };

    for (var i = 0; i < ntracks; i++) {
      _loop(i);
    }
    fs.writeFileSync(self.fpath, new Buffer.from(midi.toArray()));
  }

};