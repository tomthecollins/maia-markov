// Imports
const fs = require('fs')
const xmlpstr = require('xml2js').parseString
const convert = require('xml-js').xml2js
const mu = require('maia-util')

// Constructor for XmlImport object
export default function XmlImport(_fpath){
  // Workaround for JS context peculiarities.
  // const self = this;
  this.fpath = _fpath
  this.data = this.get_data()
  this.compObj = this.xml2json()
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
XmlImport.prototype = {
  constructor: XmlImport,

  get_data: function(){
    return fs.readFileSync(this.fpath, "utf8")
  },

  xml2json: function(){
    const self = this
    const logs = false
    const co = {}
    const rawJson = convert(self.data, {compact: false, spaces: 2})
    // Find score partwise.
    const spw = rawJson.elements.find(function(obj){
      return obj.name === "score-partwise"
    })
    // console.log("spw:", spw)
    if (spw === undefined){
      console.log("Could not find score-partwise. Returning early.")
      return
    }

    let credit = []
    spw.elements.forEach(function(obj){
      if (obj.name === "credit"){
        obj.elements.filter(function(obj){
          return obj.name === "credit-words"
        })
        .forEach(function(obj){
          // console.log("obj:", obj)
          const currJustify = obj.attributes && obj.attributes.justify
          const currValign = obj.attributes && obj.attributes.valign
          obj.elements.forEach(function(obj){
            credit.push({
              "justify": currJustify,
              "valign": currValign,
              "text": obj.text.trim()
            })
          })
        })
      }
    })
    // Try to assign name, copyright, composer, lyricist.
    // Put everything else in remarks.
    let name, copyright, composer, lyricist, remark
    const possNameIdx = credit.findIndex(function(c){
      return c.justify === "center" && c.valign === "top"
    })
    // console.log("possNameIdx:", possNameIdx)
    if (possNameIdx >= 0){
      name = [mu.timelapse_object()]
      name[0].name = credit[possNameIdx].text
      credit.splice(possNameIdx, 1)
    }
    else { name = [] }
    const possCopyrightIdx = credit.findIndex(function(c){
      return c.text.indexOf("Copyright") >= 0 ||
      c.text.indexOf("copyright") >= 0 ||
      c.text.indexOf("(C)") >= 0 ||
      c.text.indexOf(String.fromCharCode(169)) >= 0
    })
    // console.log("possCopyrightIdx:", possCopyrightIdx)
    if (possCopyrightIdx >= 0){
      copyright = [mu.timelapse_object()]
      copyright[0].displayName = credit[possCopyrightIdx].text
      credit.splice(possCopyrightIdx, 1)
    }
    else { copyright = [] }
    const possComposerIdx = credit.findIndex(function(c){
      return c.justify === "right" && c.valign === "bottom"
    })
    // console.log("possComposerIdx:", possComposerIdx)
    if (possComposerIdx >= 0){
      composer = [mu.timelapse_object()]
      composer[0].displayName = credit[possComposerIdx].text
      credit.splice(possComposerIdx, 1)
    }
    else { composer = [] }
    const possLyricistIdx = credit.findIndex(function(c){
      return c.justify === "left" && c.valign === "bottom"
    })
    // console.log("possLyricistIdx:", possLyricistIdx)
    if (possLyricistIdx >= 0){
      lyricist = [mu.timelapse_object()]
      lyricist[0].displayName = credit[possLyricistIdx].text
      credit.splice(possLyricistIdx, 1)
    }
    else { lyricist = [] }
    remark = credit.map(function(c){
      const r = mu.timelapse_object()
      r.remark = c.text
      return r
    })
    co.name = name, co.remark = remark, co.copyright = copyright, co.composer = composer, co.lyricist = lyricist

    // Populate layer.
    let layer = []
    let staffNo = 0 // Possibly obsolete
    // Find the part list.
    const pl = spw.elements.find(function(obj){
      return obj.name === "part-list"
    })
    // Find the things called part in elements of spw.
    const part = spw.elements.filter(function(obj){
      return obj.name === "part"
    })
    // Find the score part.
    const sp = pl.elements.filter(function(obj){
      return obj.name === "score-part"
    })
    // Use it to define layers.
    sp.forEach(function(obj){
      const currLayer = mu.timelapse_object()
      currLayer.type = "instrument"
      currLayer.vexflow = {}
      currLayer.vexflow.id = obj.attributes.id
      // console.log("currLayer.vexflow.id:", currLayer.vexflow.id)
      const pn = obj.elements.find(function(obj){
        return obj.name === "part-name"
      })
      if (pn !== undefined && pn.elements !== undefined && pn.elements.length > 0){
        currLayer.vexflow.name = pn.elements[0].text
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
      })
      // console.log("relClefs:", relClefs)
      relClefs.forEach(function(clef, idx){
        currLayer.staffNo = staffNo
        // console.log("clef.elements:", clef.elements)
        clef.elements.forEach(function(el){
          let propName
          switch(el.name){
            case "sign":
            propName = "clefSign"
            break
            case "line":
            propName = "clefLine"
            break
            case "clef-octave-change":
            propName = "clefOctaveChange"
            break
            default:
            // console.log("Unrecognised clef property.", clef)
          }
          if (propName){
            currLayer.vexflow[propName] = el.elements[0].text
          }
        })
        currLayer.vexflow.clef = mu.clef_sign_and_line2clef_name(
          currLayer.vexflow.clefSign,
          currLayer.vexflow.clefLine,
          currLayer.vexflow.clefOctaveChange
        )
        layer.push(mu.copy_array_object(currLayer))
        staffNo++
      })
    })
    // console.log("layer:", layer)

    // Find the parts.
    // Should be one of each of these for the whole piece of music.
    let divisions, anacrusis
    let clefChanges = [], keySignatures = [], timeSignatures = [],
    notes = [], rests = [], ties = []
    /////
    // Time signatures need more work.
    // Just putting in a default for now.
    ////
    const timeSig = mu.timelapse_object()
    timeSig.barNo = 1, timeSig.topNo = 4, timeSig.bottomNo = 4, timeSig.ontime = 0
    timeSignatures = [timeSig]

    // Iterate over them to define stuff like notes.
    part.forEach(function(obj, partIdx){
      // Catching an anacrusis and initialising ontime and intOnt are handled as
      // part of case "divisions" below.
      let ontime, intOnt
      if (anacrusis !== undefined && divisions !== undefined){
        ontime = anacrusis
        intOnt = Math.round(divisions*anacrusis)
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
      })
      // console.log("staffNosForId:", staffNosForId)
      const measure = obj.elements.filter(function(obj){
        return obj.name === "measure"
      })
      // console.log("measure:", measure)
      measure.forEach(function(obj){
        // Need to do this in order for ontime to be correct.
        const measureNumber = parseInt(obj.attributes.number)
        // console.log("measureNumber:", measureNumber, "ontime:", ontime)
        const elMeasure = obj.elements
        elMeasure.forEach(function(obj, idx){
          // console.log("Elements of the measure:")
          // console.log(obj)
          let intDur
          switch(obj.name){
            case "attributes":
            let el = obj.elements.forEach(function(obj2){
              switch(obj2.name){
                case "divisions":
                if (divisions !== undefined){
                  console.log("Redefining divisions, which is unusual/not permitted.")
                }
                divisions = parseInt(obj2.elements[0].text)
                // Now that we have a divisions value, we can determine if there
                // is an anacrusis at the beginning of this piece.
                const aAndCpb = self.convert_1st_bar2anacrusis_val(
                  elMeasure, divisions
                )
                // console.log("aAndCpb:", aAndCpb)
                anacrusis = aAndCpb[0]
                // crotchetsPerBar = aAndCpb[1]
                ontime = anacrusis
                if (divisions*anacrusis !== Math.floor(divisions*anacrusis)){
                  console.log("divisions*anacrusis is not an integer, but it should be!")
                }
                intOnt = Math.round(divisions*anacrusis)
                // console.log(
                //   "divisions:", divisions, "anacrusis:", anacrusis,
                //   "crotchetsPerBar:", crotchetsPerBar, "ontime:", ontime,
                //   "intOnt:", intOnt
                // )

                break
                case "key":
                const currKey = mu.timelapse_object()
  							currKey.barNo = measureNumber + (anacrusis === 0)
                let possFifths = obj2.elements.find(function(obj){
                  return obj.name === "fifths"
                })
                if (possFifths !== undefined){
                  possFifths = parseInt(possFifths.elements[0].text)
                }
                currKey.fifths = possFifths || 0
  							let possMode = obj2.elements.find(function(obj){
                  return obj.name === "mode"
                })
                if (possMode !== undefined){
                  possMode = possMode.elements[0].text
                }
                currKey.mode = possMode || 0
                currKey.keyName = mu.nos_symbols_and_mode2key_name(
                  currKey.fifths, currKey.mode
                )

  							// It is important to realise that when a MusicXML file says
  							// fifths, what it means is the number of sharps (positive
  							// integer) or flats (negative integer) in the key signature. So
  							// A minor will have a fifths value of 0, but A is three steps
  							// clockwise from C on the circle of fifths, so this code adjusts
  							// the fifths value of minor keys to reflect this.
                if (currKey.mode === "minor"){
                  currKey.fifthSteps += 3
                }
  							switch(currKey.mode){
  								case "major":
  									currKey.mode = 0
  									break
  								case "minor":
  									currKey.mode = 5
  									break
  								case "ionian":
  									currKey.mode = 0
  									break
  								case "dorian":
  									currKey.mode = 1
  									break
  								case "phrygian":
  									currKey.mode = 2
  									break
  								case "lydian":
  									currKey.mode = 3
  									break
  								case "mixolydian":
  									currKey.mode = 4
  									break
  								case "aeolian":
  									currKey.mode = 5
  									break
  								case "locrian":
  									currKey.mode = 6
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
                keySignatures.push(currKey)
                break
                default:
                // console.log("Should not get here in switch over measure.elements.", obj.name)
              }
            })
            break
            case "note":
            const currNote = mu.timelapse_object()
            let restTf = false, graceTf = false, cueTf = false, tieArr = []
            obj.elements.forEach(function(obj){
              switch(obj.name){
                case "pitch":
                const xmlPitch = {}
                obj.elements.forEach(function(obj){
                  xmlPitch[obj.name] = obj.elements[0].text
                })
                // console.log("xmlPitch:", xmlPitch)
                currNote.pitch = self.xml_pitch2pitch_class_and_octave(xmlPitch)
                const mnnMpn = mu.pitch_and_octave2midi_note_morphetic_pair(currNote.pitch)
                currNote.MNN = mnnMpn[0]
                currNote.MPN = mnnMpn[1]
                break
                case "rest":
                restTf = true
                break

                case "duration":
                intDur = parseInt(obj.elements[0].text)
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
                )
                // console.log("staffVoiceNos:", staffVoiceNos)
                currNote.staffNo = staffVoiceNos[0]
                currNote.voiceNo = staffVoiceNos[1]
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
                const timeMod = {}
                obj.elements.forEach(function(obj){
                  if (
                    obj.elements !== undefined && obj.elements.length > 0 &&
                    obj.elements[0].text !== undefined
                  ){
                    timeMod[obj.name] = obj.elements[0].text
                  }
                  else {
                    // console.log("obj:", obj)
                  }
                })
                currNote.timeMod = timeMod
                break
                case "stem":

                break
                case "beam":

                break
                case "tie":
                tieArr.push(obj.attributes)

                break
                case "accidental":
                currNote.accidental = obj.elements[0].text
                break
                case "notations":

                break
                default:
                case "dot":

                break
                case "grace":
                graceTf = true
                break
                case "cue":
                cueTf = true
                break
                // console.log("Should not get here in switch over note's obj.elements:", obj.name)

              } // Ends switch(obj.name)
            }) // Ends iteration over elements of the note.

            if (!graceTf && !cueTf){
              // Update ontime etc. here.
              let duration = Math.round(intDur/divisions*100000)/100000
              // This is offtime in crotchet beats rounded to 5 decimal places.
              let offtime = Math.round((intOnt + intDur)/divisions*100000)/100000
              let barBeat = mu.bar_and_beat_number_of_ontime(ontime, timeSignatures)
              let barOn = barBeat[0];
              let beatOn = Math.round(barBeat[1]*100000)/100000
              barBeat = mu.bar_and_beat_number_of_ontime(offtime, timeSignatures)
              let barOff = barBeat[0];
              let beatOff = Math.round(barBeat[1]*100000)/100000

              if (!restTf){
                currNote.barOn = barOn
                currNote.beatOn = beatOn
                currNote.ontime = ontime
                currNote.duration = duration
                currNote.barOff = barOff
                currNote.beatOff = beatOff
                currNote.offtime = offtime

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
                  notes.push(currNote)
                }
                else {
                  // console.log("tieArr:", tieArr)
                  if (tieArr.length > 1){
                    currNote.tieType = "stop and start"
                  }
                  else {
                    currNote.tieType = tieArr[0].type
                  }
                  ties.push(currNote)
                }
              }
              else {
                // ...
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
              ){
                // Do nothing!
              }
              else {
                ontime = offtime
                intOnt += intDur
                // console.log("restTf:", restTf, "ontime:", ontime, "intOnt:", intOnt)
              }
              // ...
            }
            else if (!cueTf){
              // Handle grace notes here. NB grace notes have no duration.
              // ...
            }
            else {
              // Handle cue notes here. NB cue notes have no duration.
              // ...
            }

            break

            case "backup":
            // console.log("Got to a backup.")
            intDur = parseInt(obj.elements[0].elements[0].text)
            // console.log("backup amount:", intDur)
            intOnt -= intDur
            ontime = Math.round(intOnt/divisions*100000)/100000
            // console.log("intOnt:", intOnt, "ontime:", ontime)
            break

            case "forward":
            // console.log("Got to a forward.")
            intDur = parseInt(obj.elements[0].elements[0].text)
            // console.log("forward amount:", intDur)
            intOnt += intDur
            ontime = Math.round(intOnt/divisions*100000)/100000
            // console.log("intOnt:", intOnt, "ontime:", ontime)
            break



            default:
            // console.log("Should not get here in switch over measure.elements.", obj.name)
          }
        }) // elMeasure.forEach(function(obj, idx)
      }) // measure.forEach(function(obj)
    }) // part.forEach(function(obj)

    const notesAndTied = notes.concat(
      self.resolve_ties(ties)
    )
    co.notes = notesAndTied.sort(mu.sort_points_asc)
    co.layer = layer
    co.timeSignatures = timeSignatures
    co.keySignatures = keySignatures
    // Append some miscellaneous information.
    if (co.miscImport === undefined){
      co.miscImport = {}
    }
    if (co.miscImport.musicXml === undefined){
      co.miscImport.musicXml = {
        "divisions": divisions, "anacrusis": anacrusis
      }
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
    let co = {}
    let composers = []
    let lyricists = []

    const self = this
    xmlpstr(this.data, {trim: true}, function (err, xmlAsJson){
      // console.log("xmlAsJson:", xmlAsJson)
      let metadata = []
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
  						else{
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
      let divisions
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
  								else{
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
  								else{
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
  							else{
  								curr_xprss.staffNo = staff_nos_for_this_id[0];
  							}
  							xprss_array.push(curr_xprss);
  							xprssID++;
  						}
  					}
  				}

  				// Grab the number of backups, which are used to encode multiple voices
          // in one measure on one staff.
          let backups, time_at_end_of_this_bar
          if (measure[measure_index].backup){
            backups = measure[measure_index].backup;
            // Filter out any backup values that are not equal to the maximum
            // backup value. A POTENTIALLY DANGEROUS STRATEGY, but need a way to
            // take account of backups that are associated with cue notes and so
            // do not advance voiceNo in the usual way.
            const maxBackup = mu.max_argmax(backups.map(function(b){
              return b.duration[0]
            }))[0]
            const fullBarBackups = []
            const partBarBackups = []
            backups.forEach(function(b){
              if (b.duration[0] === maxBackup){
                fullBarBackups.push(b)
              }
              else {
                partBarBackups.push(b)
              }
            })
            backups = fullBarBackups

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
                    console.log("notes[note_index].pitch[0]:", notes[note_index].pitch[0])
                    console.log("final_pitch:", final_pitch)
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
                    let articulations
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
                    let articulations
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
                if (note_index < notes.length - 1 && notes[note_index + 1].chord){
                }
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
                let grace_curr
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
                  grace_array.push(grace_curr)
                }
  						}
              else {
                // Cue note. Not dealing with these at present.
                // ...
              }
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
  			else{
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
        co.miscImport = {}
      }
      if (co.miscImport.musicXml === undefined){
        co.miscImport.musicXml = {
          "divisions": divisions, "anacrusis": anacrusis
        }
      }
  		// console.log('HERE')
      // return co;
      // console.log("co:", co)
  		// callback(co);
    })

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
    ties.sort(mu.sort_points_asc)

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
  		else{
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
  		else{
  			// Search for the note in the tied array instead.
  			target_idx = mu.array_object_index_of(tied_array, target_ID.toString(), "ID");
  			if (target_idx >= 0){
  				tied_array[target_idx].grace = ga[gi];
  			}
  			else{
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

  	let step, alter, octave
    if (npo){
      step = xml_pitch.step[0]
      if (xml_pitch.alter !== undefined){
    		alter = xml_pitch.alter[0]
    	}
      octave = xml_pitch.octave[0]
    }
    else {
      step = xml_pitch.step
      if (xml_pitch.alter !== undefined){
    		alter = xml_pitch.alter
    	}
      octave = xml_pitch.octave
    }
    //console.log(step);
  	//console.log(alter);
  	//console.log(octave);
  	let final_pitch_str;
  	let final_pitch;
  	if (alter !== undefined){
      switch(alter){
  			case '-2':
  				final_pitch_str = '"' + step + 'bb' + octave + '"';
  				final_pitch = step + 'bb' + octave;
  				break;
  			case '-1':
  				final_pitch_str = '"' + step + 'b' + octave + '"';
  				final_pitch = step + 'b' + octave;
  				break;
        case '0':
  				final_pitch_str = '"' + step + octave + '"';
  				final_pitch = step + octave;
  				break;
  			case '1':
  				final_pitch_str = '"' + step + '#' + octave + '"';
  				final_pitch = step + '#' + octave;
  				break;
  			case '2':
  				final_pitch_str = '"' + step + '##' + octave + '"';
  				final_pitch = step + '##' + octave;
  				break;
        default:
          console.log("Er, got to default in alter...")
  		}
  	}
  	else {
  		final_pitch_str = '"' + step + octave + '"';
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
    })
    // console.log("xmlTs:", xmlTs)
    const ts = {}
    if (xmlTs !== undefined){
      ts.topNo = parseInt(
        xmlTs.elements.find(function(obj){
          return obj.name === "beats"
        })
        .elements[0].text
      )
      ts.bottomNo = parseInt(
        xmlTs.elements.find(function(obj){
          return obj.name === "beat-type"
        })
        .elements[0].text
      )
    }
    else {
      console.log('It was not possible to find a time signature in the first ' +
                  'bar.')
      console.log('Returning default values for the anacrusis and crotchets '+
                  'per bar, which may be wrong.')
      return [0, 4]
    }
    // console.log("ts:", ts)
    const crotchetsPerBar = 4*ts.topNo/ts.bottomNo
    // console.log("crotchetsPerBar:", crotchetsPerBar)
    const expectedDur1stBar = divisions*crotchetsPerBar
    // console.log("expectedDur1stBar:", expectedDur1stBar)

    // Notes by voice
    const xmlNotes = bar.filter(function(obj){
      return obj.name === "note"
    })
    // console.log("xmlNotes:", xmlNotes)
    const noteDursByVoice = {}
    // Filter out grace/cue notes and collect durations by voice.
    xmlNotes
    .filter(function(xn){
      const grace = xn.elements.find(function(el){
        return el.name === "grace"
      })
      const cue = xn.elements.find(function(el){
        return el.name === "cue"
      })
      return !grace && !cue
    })
    .forEach(function(xn, idx){
      const currVoice = xn.elements.find(function(el){
        return el.name === "voice"
      })
      .elements[0].text
      const currDur = xn.elements.find(function(el){
        return el.name === "duration"
      })
      .elements[0].text

      // If the note is the first, second,..., (n - 1)th note of an n-
      // note chord, then do not increment these variables. Wait till
      // the nth note.
      if (
        idx < xmlNotes.length - 1 &&
        xmlNotes[idx + 1].elements !== undefined &&
        xmlNotes[idx + 1].elements.find(function(obj){
          return obj.name === "chord"
        })
      ){
        // Do nothing!
      }
      else {
        if (noteDursByVoice[currVoice] === undefined){
          noteDursByVoice[currVoice] = [parseInt(currDur)]
        }
        else {
          noteDursByVoice[currVoice].push(parseInt(currDur))
        }
      }
    })
    // console.log("noteDursByVoice:", noteDursByVoice)
    // Add them all up and find the maximum duration across all voices.
    const totals = Object.keys(noteDursByVoice).map(function(k){
      return mu.array_sum(noteDursByVoice[k])
    })
    // console.log("totals:", totals)
    const maxDur = mu.max_argmax(totals)[0]
    // console.log("maxDur:", maxDur)

    if (maxDur < expectedDur1stBar){
      // console.log("Anacrusis!")
      const anacrusis = -maxDur/divisions
      return [anacrusis, crotchetsPerBar]
    }
    else if (maxDur === expectedDur1stBar){
      // console.log("No anacrusis!")
      return [0, crotchetsPerBar]
    }
    else {
      console.log('Unexpected anacrusis value.')
      console.log('Returning default values for the anacrusis and crotchets '+
                  'per bar, which may be wrong.')
      return [0, 4]
    }
  }

}
