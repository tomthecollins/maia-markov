/**
 * @file Welcome to the API for MAIA Markov!
 *
 * MAIA Markov is a JavaScript package used by Music Artificial Intelligence
 * Algorithms, Inc. in various applications that we have produced or are
 * developing currently.
 *
 * If you already know about JavaScript app development and music computing,
 * then probably the best starting point is the
 * [NPM package](https://npmjs.com/package/maia-markov/).
 *
 * If you have a music computing background but know little about JavaScript,
 * then the tutorials menu is a good place to start. There are also some
 * fancier-looking demos available
 * [here](http://tomcollinsresearch.net/mc/ex/),
 * some of which involve MAIA Markov methods to some degree.
 *
 * If you don't know much about music or music computing, then the
 * [fancier-looking demos](http://tomcollinsresearch.net/mc/ex/) are still the
 * best place to start, to get hooked on exploring web-based, interactive music
 * interfaces.
 *
 * This documentation is in the process of being completed. Some functions have
 * not had their existing documentation converted to JSDoc format yet.
 *
 * @version 0.1.8
 * @author Tom Collins and Christian Coulon
 * @copyright 2015-2024
 *
 */

// import './util_array'
// import append_ontimes_to_time_signatures_default from './append_ontimes_to_time_signatures'
// import {
//   fifth_steps_mode as fifth_steps_mode_default,
//   aarden_key_profiles as aarden_key_profiles_default,
//   krumhansl_and_kessler_key_profiles as krumhansl_and_kessler_key_profiles_default
// } from './util_key'
import PatternGenerator_default from './PatternGenerator'
import Analyzer_default from './Analyzer'
import Generator_default from './Generator'
import KeyValuePair_default from './KeyValuePair'
import Vertex_default from './Vertex'
import Edge_default from './Edge'
import Heap_default from './Heap'
import PriorityQueue_default from './PriorityQueue'
import Graph_default from './Graph'
import MidiImport_default from './MidiImport'
import MidiExport_default from './MidiExport'
import XmlImport_default from './XmlImport'
import KernImport_default from './KernImport'

export const PatternGenerator = PatternGenerator_default
export const Analyzer = Analyzer_default
export const Generator = Generator_default
export const KeyValuePair = KeyValuePair_default
export const Vertex = Vertex_default
export const Edge = Edge_default
export const Heap = Heap_default
export const PriorityQueue = PriorityQueue_default
export const Graph = Graph_default
export const MidiImport = MidiImport_default
export const MidiExport = MidiExport_default
export const XmlImport = XmlImport_default
export const KernImport = KernImport_default

export default {
  PatternGenerator,
  Analyzer,
  Generator,
  KeyValuePair,
  Vertex,
  Edge,
  Heap,
  PriorityQueue,
  Graph,
  MidiImport,
  MidiExport,
  XmlImport,
  KernImport

}
