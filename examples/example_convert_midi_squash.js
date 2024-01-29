// 25.2.2020
// An important script for demonstrating to Imogen some of the transcriptions
// and what they sound like when squashed in range.

// Individual user paths.
const mainPaths = {
  "tom": __dirname + "/../../../Data/Music/imogen_heap/",
  "anotherUser": __dirname + "/path/to/folder/of/json,midi,etc/folders/"
};

// Requires.
const fs = require("fs")
const uu = require("uuid/v4")
const { Midi } = require('@tonejs/midi')
const mu = require("maia-util")

const an = require("./analyze")


// Parameters
var stms = [
  {
    "tag": "Tiny string quartet",
    "dirName": 1
  },

];

// Grab user name from command line to set path to data.
var nextU = false
var mainPath;
process.argv.forEach(function(arg, ind){
  if (arg === "-u"){
    nextU = true
  }
  else if (nextU){
    mainPath = mainPaths[arg]
    nextU = false
  }
})
// Make output directory.
var outdir = mainPath + "midi_squash/";
// fs.mkdir(outdir);

// Get transcription metadata.
const md = require(mainPath + "transcription_remarks.json")
var midiDirs = fs.readdirSync(mainPath);
midiDirs = midiDirs.filter(function(midiDir){
  return midiDir == "midi_post_logic";
})
console.log("midiDirs:", midiDirs)
midiDirs.forEach(function(midiDir, jDir){
  console.log("Working on midiDir:", midiDir, "jDir:", jDir);
  var pComps = [];
  var pFiles = fs.readdirSync(mainPath + midiDir);
  pFiles = pFiles.filter(function(pFile){
    return pFile.split(".")[1] == "mid"
  })
  console.log("pFiles.length:", pFiles.length);

  pFiles.forEach(function(pFile, iFile){
  // pFiles.slice(0, 5).forEach(function(pFile, iFile){
    if (iFile % 10 == 0){
      console.log("!!! PFILE " + (iFile + 1) + " OF " + pFiles.length + " !!!")
    }
    console.log("pFile:", pFile)
    try {
      const midiData = fs.readFileSync(mainPath + midiDir + "/" + pFile);
      const midi = new Midi(midiData)
      console.log("midi.header.timeSignatures:", midi.header.timeSignatures)
      let points = []
      midi.tracks.map(function(track){
        track.notes.map(function(n){
          points.push([
            n.ticks/midi.header.ppq,
            n.midi,
            n.durationTicks/midi.header.ppq,
            track.channel,
            n.velocity
          ])
        })
      })
      console.log("points.slice(0, 5):", points.slice(0, 5));
      var fsm = mu.fifth_steps_mode(points, mu.krumhansl_and_kessler_key_profiles)
      console.log("fsm:", fsm)
      points.map(function(p){
        p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
      })
      points = mu.farey_quantise(
        points,
        mu.farey(4),
        [0, 3]
      );
      let tp_ps = an.centre_point_set(fsm.slice(2), points)
      console.log("tp_ps[0]:", tp_ps[0])
      console.log("tp_ps[1].slice(0, 5):", tp_ps[1].slice(0, 5))
      // Do the squash.
      let sq = tp_ps[1].map(function(p){
        while (p[1] > 12 || p[1] < -12){
          if (p[1] > 12){
            p[1] -= 12
            p[2] -= 7
          }
          else {
            p[1] += 12
            p[2] += 7
          }
        }
        return p
      })
      // Add the tonic pitch closest back on again for MIDI0-writing purposes.
      sq = sq.map(function(p){
        p[1] += tp_ps[0][0]
        p[2] += tp_ps[0][1]
        return p
      })
      console.log("sq.slice(0, 5):", sq.slice(0, 5))
      var midi2 = new Midi()
      // add a track
      const track = midi2.addTrack()
      sq.map(function(p){
        track.addNote({
          midi: p[1],
          time: p[0]/2,
          duration: p[3]/2,
          velocity: p[5]
        })
      })

      // write the output
      fs.writeFileSync(outdir + pFile, new Buffer(midi2.toArray()))


      // var comp = an.note_point_set2comp_obj(points, true, 0, 1, 3, 4, 5);
      // // console.log("comp:", comp);
      // // Strip off file extension.
      // pFile = pFile.split(".")[0];
      // comp["id"] = uu();
      // // comp["idGmd"] = pFile
      // comp["name"] = pFile;
      // // comp["name"] = midi.header.name || mFile.split(".")[0] // "_new"
      // comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
      // pComps.push(comp);
    }
    catch (e) {
      console.log(e)
    }
  });
  // var pStm = an.construct_stm(pComps, "beat_rel_MNN_state");
  // console.log("pStm.length:", pStm.length);
  // // console.log("pStm[0].beat_mnn_state:", pStm[0].beat_mnn_state);
  // // console.log("pStm.slice(0, 1):", pStm.slice(0, 1));
  // fs.writeFileSync(
  //   outdir + midiDir + ".js",
  //   // "var perc_" + midiDir + " = " +
  //   JSON.stringify(pStm, null, 2)
  //   // + ";"
  // )
})
