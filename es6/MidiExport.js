// Imports
// import fs
const fs = require('fs')
const { Midi } = require('@tonejs/midi')
const mu = require('maia-util')

// Constructor for MidiExport object
class MidiExport {
  constructor(
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
    this.points = _points
    this.controlChanges = _controlChanges
    this.fpath = _fpath
    this.scaleFactor = _param.scaleFactor
    this.timeSigTopNo = _param.timeSigTopNo
    this.timeSigBottomNo = _param.timeSigBottomNo
    this.noteIndices = {}
    this.noteIndices.ontimeIndex = _param.noteIndices.ontimeIndex
    this.noteIndices.mnnIndex = _param.noteIndices.mnnIndex
    this.noteIndices.durationIndex = _param.noteIndices.durationIndex
    this.noteIndices.channelIndex = _param.noteIndices.channelIndex
    this.noteIndices.velocityIndex = _param.noteIndices.velocityIndex
    this.ccIndices = {}
    if (_param.ccIndices){
      this.ccIndices.ontimeIndex = _param.ccIndices.ontimeIndex
      this.ccIndices.numberIndex = _param.ccIndices.numberIndex
      this.ccIndices.channelIndex = _param.ccIndices.channelIndex
      this.ccIndices.valueIndex = _param.ccIndices.valueIndex
    }
    this.my_export()
    // Possible to return something.
    // return sth;
  }

  my_export(){
    const self = this
    let ontimeCorrection = 0
    const minOntime = mu.min_argmin(
      self.points.map(function(p){ return p[self.noteIndices.ontimeIndex] })
    )[0]
    if (minOntime < 0){
      ontimeCorrection = 4*self.timeSigtopNo/self.timeSigBottomNo
    }

    // Organise the points and control changes according to their channel numbers.
    const pointsByChan = []
    const ccByChan = []
    self.points.forEach(function(p){
      if (pointsByChan[p[self.noteIndices.channelIndex]] === undefined){
        pointsByChan[p[self.noteIndices.channelIndex]] = [p]
      }
      else {
        pointsByChan[p[self.noteIndices.channelIndex]].push(p)
      }
    })
    if (self.controlChanges !== null){
      self.controlChanges.forEach(function(cc){
        if (ccByChan[cc[self.ccIndices.channelIndex]] === undefined){
          ccByChan[cc[self.ccIndices.channelIndex]] = [cc]
        }
        else {
          ccByChan[cc[self.ccIndices.channelIndex]].push(cc)
        }
      })
    }


    let midi = new Midi()
    // "Works" but actually changes nothing!:
    // midi.header.setTempo(240)
    // console.log("midi.header:", midi.header)
    let ntracks = Math.max(pointsByChan.length, ccByChan.length)
    for (let i = 0; i < ntracks; i++){
      const track = midi.addTrack()
      track["channel"] = i
      if (pointsByChan[i] !== undefined){
        pointsByChan[i].forEach(function(p){
          track.addNote({
            midi: p[self.noteIndices.mnnIndex],
            time: self.scaleFactor*(p[self.noteIndices.ontimeIndex] + ontimeCorrection),
            duration: self.scaleFactor*p[self.noteIndices.durationIndex],
            velocity: p[self.noteIndices.velocityIndex]
          })
        })
      }
      if (ccByChan[i] !== undefined){
        ccByChan[i].forEach(function(cc){
          track.addCC({
            number: cc[self.ccIndices.numberIndex],
            time: self.scaleFactor*(cc[self.ccIndices.ontimeIndex] + ontimeCorrection),
            value: cc[self.ccIndices.valueIndex]
          })
        })
      }
    }
    fs.writeFileSync(
      self.fpath,
      new Buffer.from(midi.toArray())
    )
  }
}

export default MidiExport
