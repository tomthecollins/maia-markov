// Tom Collins 22/3/2015.
// This function takes an array of states as its argument, and returns an
// array containing the duration of each state.
function state_durations_by_beat(states, crotchetBeatsInBar){
  const idxDur = 3
  // console.log("states:", states);
  var context_durations = [];
  for (stati = 0; stati < states.length; stati++) {
    var durs = [];
    for (pti = 0; pti < states[stati].context.orig_points.length; pti++) {
      durs.push(states[stati].context.orig_points[pti][idxDur]);
    }
    context_durations.push(durs);
  }
  // console.log('context_durations:');
  // console.log(context_durations);
  var min_durations = [];
  for (stati = 0; stati < states.length; stati++) {
    if (context_durations[stati].length > 0) {
      var curr_min = mu.min_argmin(context_durations[stati]);
      min_durations.push(curr_min[0]);
    }
    else {
      min_durations.push(0);
    }
  }
  // console.log('min_durations:');
  // console.log(min_durations);
  // console.log('states.length:', states.length);
  var inter_state_durations = [];
  for (stati = 0; stati < states.length - 1; stati++) {
    // console.log('stati:', stati);
    // console.log("states[stati + 1].beatMNNState", states[stati + 1].beatMNNState)
    if (states[stati + 1].beat_MNN_state[0] ==
      states[stati].beat_MNN_state[0]) {
      inter_state_durations.push(crotchetBeatsInBar);
    }
    else {
      var curr_isd = states[stati + 1].beat_MNN_state[0] -
        states[stati].beat_MNN_state[0];
      inter_state_durations.push(mod(curr_isd, crotchetBeatsInBar));
    }
  }
  // console.log('inter_state_durations:');
  // console.log(inter_state_durations);
  var mod_state_durations = [];
  for (stati = 0; stati < states.length - 1; stati++) {
    // I'm not quite sure about the sense of this next test.
    if (min_durations[stati] > crotchetBeatsInBar) {
      mod_state_durations.push(min_durations[stati]);
    }
    else {
      mod_state_durations.push(inter_state_durations[stati]);
    }
  }
  mod_state_durations.push(min_durations[states.length - 1]);
  // console.log('mod_state_durations:', mod_state_durations);
  return mod_state_durations;
}

// Tom Collins 6/4/2016.
// The ith note of the jth half-state is transformed into a so-called point,
// meaning we find its ontime (the jth element of the unique times), its MIDI
// note number, morphetic pitch number, duration, and staff number.
function state_note_abs2point_by_lookup(
  notei, statj, half_states, state_durs, unique_times
){
  const idxStaffNo = 4, idxVelocity = 5
  var curr_state = half_states[statj];
  var ontime = unique_times[statj];
  var MNN = curr_state.MNNs[notei];
  var MPN = curr_state.MPNs[notei];
  // Determine if this pitch occurred in the previous segment too.
  if (statj > 0 && MNN != undefined) {
    var idx_in_prev_segment = half_states[statj - 1].MNNs.indexOf(MNN);
  }
  // Determine if this pitch should be held over into the current state.
  if (idx_in_prev_segment != undefined && idx_in_prev_segment >= 0) {
    if (index_of_offtime_by_lookup(
        statj - 1, MNN, half_states, state_durs) >= statj) {
      var held_over = true;
    }
  }
  // Determine by which state this pitch has ended.
  if (MNN != undefined) {
    var offtime_state = index_of_offtime_by_lookup(
      statj, MNN, half_states, state_durs
    );
  }
  // Assign a voice number.
  if (MNN != undefined) {
    //var voice = curr_state.context.orig_points[notei][4];
    //Simran: Not sure, if this is what it was doing
    var voice = curr_state.context.orig_points[notei][idxStaffNo];
    var velocity = curr_state.context.orig_points[notei][idxVelocity];
  }
  // Define and return the point.
  if (MNN != undefined && held_over == undefined) {
    var point = [
      ontime, MNN, MPN,
      unique_times[offtime_state + 1] - unique_times[statj],
      voice, velocity];
    // console.log('Point for state ' + statj + ', note ' + notei + ':');
    // console.log('offtime_state:');
    // console.log(offtime_state);
    // console.log('point:');
    // console.log(point);
    return point;
  }
  else {
    return undefined;
  }
}

// Tom Collins 22/3/2015.
// Given a starting index, a MIDI note number, and some half-states to search
// through, this function returns the index of the half-state where the MIDI
// note number in question comes to an end.
function index_of_offtime_by_lookup(statj, MNN, half_states, state_durs){
  for (j = statj; j < half_states.length; j++) {
    var note_idx = half_states[j].MNNs.indexOf(MNN);
    var context_durs = [];
    for (pti = 0; pti < half_states[j].context.orig_points.length; pti++) {
      context_durs.push(half_states[j].context.orig_points[pti][3]);
    }
    if (j < half_states.length - 1) {
      var find_MNN_in_next_segment = half_states[j + 1].MNNs.indexOf(MNN);
    }

    if (//j >= half_states.length ||
      find_MNN_in_next_segment == undefined ||
      find_MNN_in_next_segment == -1 ||
      context_durs[note_idx] <= state_durs[j]
    ){
      var ans = j;
      break;
    }
  }
  if (ans == undefined) {
    return half_states.length - 1;
  }
  else {
    return ans;
  }
}
