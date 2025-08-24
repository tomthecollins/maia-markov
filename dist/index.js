'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KernImport = exports.XmlImport = exports.MelodyExtractor = exports.MidiExport = exports.MidiImport = exports.Graph = exports.PriorityQueue = exports.Heap = exports.Edge = exports.Vertex = exports.KeyValuePair = exports.Generator = exports.Analyzer = exports.PatternGenerator = undefined;

var _PatternGenerator = require('./PatternGenerator');

var _PatternGenerator2 = _interopRequireDefault(_PatternGenerator);

var _Analyzer = require('./Analyzer');

var _Analyzer2 = _interopRequireDefault(_Analyzer);

var _Generator = require('./Generator');

var _Generator2 = _interopRequireDefault(_Generator);

var _KeyValuePair = require('./KeyValuePair');

var _KeyValuePair2 = _interopRequireDefault(_KeyValuePair);

var _Vertex = require('./Vertex');

var _Vertex2 = _interopRequireDefault(_Vertex);

var _Edge = require('./Edge');

var _Edge2 = _interopRequireDefault(_Edge);

var _Heap = require('./Heap');

var _Heap2 = _interopRequireDefault(_Heap);

var _PriorityQueue = require('./PriorityQueue');

var _PriorityQueue2 = _interopRequireDefault(_PriorityQueue);

var _Graph = require('./Graph');

var _Graph2 = _interopRequireDefault(_Graph);

var _MidiImport = require('./MidiImport');

var _MidiImport2 = _interopRequireDefault(_MidiImport);

var _MidiExport = require('./MidiExport');

var _MidiExport2 = _interopRequireDefault(_MidiExport);

var _MelodyExtractor = require('./MelodyExtractor');

var _MelodyExtractor2 = _interopRequireDefault(_MelodyExtractor);

var _XmlImport = require('./XmlImport');

var _XmlImport2 = _interopRequireDefault(_XmlImport);

var _KernImport = require('./KernImport');

var _KernImport2 = _interopRequireDefault(_KernImport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
 * @version 0.1.13
 * @author Tom Collins and Christian Coulon
 * @copyright 2015-2025
 *
 */

// import './util_array'
// import append_ontimes_to_time_signatures_default from './append_ontimes_to_time_signatures'
// import {
//   fifth_steps_mode as fifth_steps_mode_default,
//   aarden_key_profiles as aarden_key_profiles_default,
//   krumhansl_and_kessler_key_profiles as krumhansl_and_kessler_key_profiles_default
// } from './util_key'
var PatternGenerator = exports.PatternGenerator = _PatternGenerator2.default;
var Analyzer = exports.Analyzer = _Analyzer2.default;
var Generator = exports.Generator = _Generator2.default;
var KeyValuePair = exports.KeyValuePair = _KeyValuePair2.default;
var Vertex = exports.Vertex = _Vertex2.default;
var Edge = exports.Edge = _Edge2.default;
var Heap = exports.Heap = _Heap2.default;
var PriorityQueue = exports.PriorityQueue = _PriorityQueue2.default;
var Graph = exports.Graph = _Graph2.default;
var MidiImport = exports.MidiImport = _MidiImport2.default;
var MidiExport = exports.MidiExport = _MidiExport2.default;
var MelodyExtractor = exports.MelodyExtractor = _MelodyExtractor2.default;
var XmlImport = exports.XmlImport = _XmlImport2.default;
var KernImport = exports.KernImport = _KernImport2.default;

exports.default = {
  PatternGenerator: PatternGenerator,
  Analyzer: Analyzer,
  Generator: Generator,
  KeyValuePair: KeyValuePair,
  Vertex: Vertex,
  Edge: Edge,
  Heap: Heap,
  PriorityQueue: PriorityQueue,
  Graph: Graph,
  MidiImport: MidiImport,
  MidiExport: MidiExport,
  MelodyExtractor: MelodyExtractor,
  XmlImport: XmlImport,
  KernImport: KernImport

};