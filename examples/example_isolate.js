var mu = require("maia-util")
var an = require("./analyze")

// Example:
var comp_obj = {
 "id":"KO3S1U",
 "name":"If ye love me",
 "composers": [
   { "id":"HH123J", "name":"tallis_thomas", "displayName":"Thomas Tallis" }
 ],
 "keySignatures": [
   { "barNo":1, "keyName":"F major", "fifthSteps":-1, "mode":0, "ontime":0 }
 ],
 "timeSignatures": [
   { "barNo":1, "topNo":4, "bottomNo":4, "ontime":0 }
 ],
 "notes": [
   { "ID":"3",
     "ontime":0, "duration":3, "offtime":3,
     "barOn":1, "beatOn":1, "barOff":1, "beatOff":4,
     "pitch":"F4", "MNN":65, "MPN":63,
     "staffNo":0, "voiceNo":1 },
   { "ID":"53",
     "ontime":3, "duration":1, "offtime":4,
     "barOn":1, "beatOn":4, "barOff":2, "beatOff":1,
     "pitch":"F4", "MNN":65, "MPN":63,
     "staffNo":0, "voiceNo":1 },
   { "ID":"10",
     "ontime":4, "duration":2, "offtime":6,
     "barOn":2, "beatOn":1, "barOff":2, "beatOff":3,
     "pitch":"G4", "MNN":67, "MPN":64,
     "staffNo":0, "voiceNo":1 },
   { "ID":"32",
     "ontime":4, "duration":2, "offtime":6,
     "barOn":2, "beatOn":1, "barOff":2, "beatOff":3,
     "pitch":"Bb4", "MNN":70, "MPN":66,
     "staffNo":0, "voiceNo":1 }
 ]
}
var ans = an.comp_obj2beat_rel_mnn_states(comp_obj);
console.log("ans[0]:", ans[0]);
console.log("ans[1]:", ans[1]);
console.log("ans[2]:", ans[2]);
// Should give:
// [[1, [0]], [4, [0]], [1, [2, 5]]].
