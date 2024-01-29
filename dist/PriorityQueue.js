'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PriorityQueue;

var _Heap = require('./Heap');

var _Heap2 = _interopRequireDefault(_Heap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class for Priority Queue datastructure.
 *
 * @constructor
 * @extends {goog.structs.Heap<number, VALUE>}
 * @template VALUE
 * @final
 */
function PriorityQueue() {
  this.heap = new _Heap2.default();
  // goog.structs.Heap.call(this);
} // Adapted from Google's Closure library.
// https://github.com/google/closure-library/blob/master/closure/goog/structs/priorityqueue.js#L34
// Would be better if PQ inherited Heap rather than using it, but this'll do for
// now.

// Imports
;
// goog.inherits(goog.structs.PriorityQueue, goog.structs.Heap);


/**
 * Puts the specified value in the queue.
 * @param {number} priority The priority of the value. A smaller value here
 *     means a higher priority.
 * @param {VALUE} value The value.
 */
PriorityQueue.prototype.enqueue = function (priority, value) {
  this.heap.insert(priority, value);
};

/**
 * Retrieves and removes the head of this queue.
 * @return {VALUE} The element at the head of this queue. Returns undefined if
 *     the queue is empty.
 */
PriorityQueue.prototype.dequeue = function () {
  // console.log("this.heap.getCount() from beginning of dequeue():", this.heap.getCount())
  var value = this.heap.remove();
  // console.log("this.heap.getCount() from end of dequeue():", this.heap.getCount())
  return value;
  //  return this.heap.remove();
};