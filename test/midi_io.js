const fs = require("fs")
const { Midi } = require('@tonejs/midi')

// Reading in.
const midiData = fs.readFileSync("/Users/tomthecollins/Shizz/Data/Music/imogen_heap/midi_post_logic/half_life.mid")
const midi = new Midi(midiData)
console.log("midi.header:", midi.header)

console.log("midi.tracks[0].notes[0].time:", midi.tracks[0].notes[0].time)
console.log("midi.tracks[0].notes[0].duration:", midi.tracks[0].notes[0].duration)
// console.log("midi.tracks[0].notes.slice(0, 10):", midi.tracks[0].notes.slice(0, 10))
// console.log("midi.tracks[0].notes.length", midi.tracks[0].notes.length)


// // Writing out.
// // create a new midi file
// var midi2 = new Midi()
// // add a track
// const track = midi2.addTrack()
// track.addNote({
//   midi : 60,
//   time : 0,
//   duration: 0.2
// })
// .addNote({
//   name : 'C5',
//   time : 0.3,
//   duration: 0.1
// })
// .addCC({
//   number : 64,
//   value : 127,
//   time : 0.2
// })
//
// // write the output
// fs.writeFileSync("./output.mid", new Buffer(midi2.toArray()))
