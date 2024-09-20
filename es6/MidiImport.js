// Imports
// import fs
const fs = require('fs')
const pa = require('path')
const { Midi } = require('@tonejs/midi')
const mu = require('maia-util')
import Analyzer from './Analyzer'

/**
 * Class for importing MIDI files and extracting information from them.
 */
class MidiImport {
  /**
   * Constructor for the MidiImport class.
   * @param {string} _fpath - The file path of the MIDI file.
   * @param {function} _f - The function for returning the nth Farey set.
   * @param {number} _anc - The anacrusis value.
   */
  constructor(_fpath, _f = mu.farey(4), _anc = 0){
    // Workaround for JS context peculiarities.
    // var self = this;
    this.fpath = _fpath
    this.data = this.get_data(this.fpath)
    this.timeSigs = this.get_time_sigs()
    this.anacrusis = _anc
    this.points = this.get_points()
    // this.points.slice(0, 3).forEach(function(p, i){
    //   console.log("points[" + i + "]:", p)
    // })
    this.controlChanges = this.get_control_changes()
    this.compObj = this.get_comp_obj(_f)
    // Possible to return something.
    // return sth;
  }

  /**
   * Finds the bass track in the MIDI file.
   * @return {Array} candidates - The array of candidates for bass tracks.
   */
  find_bass_track(){
    const tracks = this.data.tracks
    const trg = [
      ["bass"]
    ]
    let candidates = []
    let synthCandidates = [] // In absence of bass family, accept this.
    // First phase of finding.
    tracks.forEach(function(trk, idx){
      const fam = trk.instrument.family
      const nam = trk.instrument.name
      trg.forEach(function(t){
        if (fam === t[0]){
          candidates.push([idx, fam + " -> " + nam])
        }
      })
      if (fam === "synth lead" && nam === "lead 8 (bass + lead)"){
        synthCandidates.push([idx, "synth lead -> lead 8 (bass + lead)"])
      }
    })

    // Remove any empty tracks.
    candidates = candidates.filter(function(c){
      return tracks[c[0]].notes.length > 0
    })
    synthCandidates = synthCandidates.filter(function(c){
      return tracks[c[0]].notes.length > 0
    })
    .sort(function(a, b){
      return tracks[b[0]].notes.length - tracks[a[0]].notes.length
    })

    if (candidates.length === 0){
      if (synthCandidates.length > 0){
        console.log("Found a suitable synth instead in absence of any bass.")
        return [synthCandidates[0]]
      }
      console.log("No bass track targets identified. Returning undefined.")
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family
        const nam = trk.instrument.name
        console.log("fam:", fam, ", nam:", nam)
      })
      return
    }
    if (candidates.length === 1){
      return candidates
    }

    console.log("Multiple bass track targets identified. Returning them.")
    console.log("candidates:", candidates)
    candidates.forEach(function(c){
      const fam = tracks[c[0]].instrument.family
      const nam = tracks[c[0]].instrument.name
      console.log("fam:", fam, ", nam:", nam)
      console.log("tracks[c[0]].notes.length:", tracks[c[0]].notes.length)
    })
    return candidates
  }

  /**
   * Finds the drum track in the MIDI file.
   * @return {Array} candidates - The array of candidates for drum tracks.
   */
  find_drum_track(){
    const tracks = this.data.tracks
    const trg = [
      ["drums"]
    ]
    let candidates = []
    // First phase of finding.
    tracks.forEach(function(trk, idx){
      const fam = trk.instrument.family
      const nam = trk.instrument.name
      trg.forEach(function(t){
        if (fam === t[0]){
          candidates.push([idx, fam + " -> " + nam])
        }
      })
    })

    // Remove any empty tracks.
    candidates = candidates.filter(function(c){
      return tracks[c[0]].notes.length > 0
    })

    if (candidates.length === 0){
      console.log("No drum track targets identified. Returning undefined.")
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family
        const nam = trk.instrument.name
        console.log("fam:", fam, ", nam:", nam)
      })
      return
    }
    if (candidates.length === 1){
      return candidates
    }

    console.log("Multiple drum track targets identified. Returning them.")
    console.log("candidates:", candidates)
    candidates.forEach(function(c){
      const fam = tracks[c[0]].instrument.family
      const nam = tracks[c[0]].instrument.name
      console.log("fam:", fam, ", nam:", nam)
      console.log("tracks[c[0]].notes.length:", tracks[c[0]].notes.length)
    })
    return candidates
  }

  /**
   * Finds the homophonic track in the MIDI file.
   * @return {Array} candidates - The array of candidates for homophonic tracks.
   */
  find_homophonic_track(){
    const self = this
    const tracks = self.data.tracks.filter(function(trk){
      return trk.instrument.family !== "drums" && trk.notes.length > 50
    })

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
      })
      const seg = mu.segment(points, false)
      let homoCount = 0
      seg.forEach(function(s){
        if (s.points.length >= 2){
          homoCount += s.points.length
        }
      })
      return { "idx": idx, "score": homoCount/seg.length }
    })
    .sort(function(a, b){
      return b.score - a.score
    })
    console.log("homophonyScores:", homophonyScores)
    if (
      homophonyScores.length > 0 &&
      homophonyScores[0]["score"] >= 2
    ){
      const relIdx = homophonyScores[0]["idx"]
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
    const self = this
    const tracks = self.data.tracks
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
    ]
    let candidates = []
    // First phase of finding.
    tracks.forEach(function(trk, idx){
      const fam = trk.instrument.family
      const nam = trk.instrument.name
      // console.log("fam:", fam, ", nam:", nam)

      trg.forEach(function(t){
        if (fam === t[0]){
          if (fam === "synth lead"){
            if (nam === t[1]){
              candidates.push([idx, fam + " -> " + nam])
            }
            else {
              candidates.push([idx, "generic synth lead"])
            }
          }
          else {
            if (nam === t[1]){
              candidates.push([idx, fam + " -> " + nam])
            }
          }
        }
      })

    })
    // Remove any empty tracks.
    candidates = candidates.filter(function(c){
      return tracks[c[0]].notes.length > 0
    })

    if (candidates.length === 0){
      console.log("No vocal track targets identified. Returning undefined.")
      tracks.forEach(function(trk, idx){
        const fam = trk.instrument.family
        const nam = trk.instrument.name
        console.log("fam:", fam, ", nam:", nam)
      })
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
      console.log("candidates:", candidates)
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
        })
        console.log("points.length:", points.length)
        console.log("points.slice(0, 5):", points.slice(0, 5))
        const seg = mu.segment(points, false)
        let monoCount = 0
        seg.forEach(function(s){
          if (s.points.length < 2){
            monoCount++
          }
        })
        return monoCount/seg.length
      })
      console.log("monophonyScores:", monophonyScores)
      const ma = mu.max_argmax(monophonyScores)
      return candidates[ma[1]]
    }

    // Third phase. Return first match in case of multiple matches.
    let i = 0
    let relIdx = -1
    while (i < trg.length && relIdx < 0){
      relIdx = candidates.findIndex(function(c){
        return c[1] === trg[i][0] + " -> " + trg[i][1]
      })
      if (relIdx >= 0){
        i = trg.length - 1
      }
      i++
    }
    if (relIdx >= 0){
      return candidates[relIdx]
    }

    // Fourth phase of finding
    // Sometimes there are multiple of synth lead, I'm returning the first
    // encountered.
    relIdx = candidates.findIndex(function(c){
      return c[1] === "generic synth lead"
    })
    if (relIdx >= 0){
      return candidates[relIdx]
    }

    console.log("\n!! Vocal track determination unclear !!")
    tracks.forEach(function(trk, idx){
      const fam = trk.instrument.family
      const nam = trk.instrument.name
      console.log("fam:", fam, ", nam:", nam)
    })
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
    const an = new Analyzer
    let comp = an.note_point_set2comp_obj(
      this.points, this.timeSigs, false, f, 0, 1, 2, 3, 4
    );
    console.log("comp.notes.length:", comp.notes.length)
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
    const pFile = pa.basename(this.fpath, pa.extname(this.fpath))
    comp["id"] = pFile
    comp["name"] = pFile;
    comp["composers"] = [{"id": "default_composer", "name": "none", "displayName": "None"}]
    return comp
  }

  /**
   * Gets the control changes for the MIDI file.
   * @param {number} anacrusis - The anacrusis value.
   * @return {Array} cc - The array of control changes for the MIDI file.
   */
  get_control_changes(anacrusis){
    const self = this
    const cc = self.data.tracks.map(function(track){
      const ccCurrTrack = {}
      const props = Object.keys(track.controlChanges)
      props.forEach(function(p){
        ccCurrTrack[p] = track.controlChanges[p].map(function(c){
          const obj = mu.timelapse_object()
          obj.ontime = Math.round(100000*(c.ticks/self.data.header.ppq - anacrusis))/100000
          // What about the anacrusis effect on onset?!
          obj.onset = Math.round(100000*c.time)/100000
          obj.value = Math.round(100000*c.value)/100000
          return obj
        })
      })
      return ccCurrTrack
    })
    return cc
  }

  /**
   * Gets the data from the MIDI file.
   * @return {object} midiData - The data from the MIDI file.
   */
  get_data(){
    const midiData = fs.readFileSync(this.fpath);
    return new Midi(midiData)
  }

  /**
   * Gets the phrase boundary ontimes for the MIDI file.
   * @param {number} [restDur=1] - The rest duration.
   * @param {string} [property="offtime"] - The property of the phrase boundary.
   * @return {Array} pbo - The array of phrase boundary ontimes for the MIDI file.
   */
  get_phrase_boundary_ontimes(restDur = 1, property = "offtime"){
    let pbo = []
    const segs = mu.segment(this.points, true, 0, 2)
    segs.forEach(function(seg, idx){
      if (seg.points.length == 0 && seg.offtime - seg.ontime >= restDur){
        pbo.push(seg[property])
        // Fixed this bug where property wasn't being used...
        // pbo.push(seg.offtime)
      }
    })
    return pbo
  }

  /**
   * Get points from the MIDI file
   *
   * @param {number} anacrusis - Anacrusis, the unaccented beats at the beginning of a musical phrase
   * @return {array} points - List of sorted points
   */
  get_points(){
    const self = this
    let points = []
    self.data.tracks.forEach(function(track){
      track.notes.forEach(function(n){
        points.push([
          n.ticks/self.data.header.ppq,
          n.midi,
          n.durationTicks/self.data.header.ppq,
          track.channel,
          Math.round(1000*n.velocity)/1000
        ])
      })
    })
    const unqPoints = mu.unique_rows(points, true)[0]
    const minOntime = unqPoints[0][0]
    if (this.anacrusis === "Shift to zero"){
      unqPoints.forEach(function(pt){
        pt[0] -= minOntime
      })
    }
    else if (this.anacrusis > 0){
      unqPoints.forEach(function(pt){
        pt[0] -= this.anacrusis
      })
    }
    // Update anacrusis so it is no longer a string value.
    this.anacrusis = unqPoints[0][0]
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
    const self = this
    // Set defaul timeSigs.
    let timeSigs = [
      { "barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0 }
    ]
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
      })[0]]
    }
    console.log("timeSigs:", timeSigs)
    return timeSigs
  }
}
export default MidiImport
