// Adapted from Google's Closure library.
// https://github.com/google/closure-library/blob/master/closure/goog/structs/priorityqueue.js#L34
// Would be better if PQ inherited Heap rather than using it, but this'll do for
// now.

// Imports
import Heap from './Heap'

/**
 * Class for Priority Queue datastructure.
 *
 * @constructor
 * @extends {goog.structs.Heap<number, VALUE>}
 * @template VALUE
 * @final
 */
export default function PriorityQueue() {
  this.heap = new Heap()
  // goog.structs.Heap.call(this);
};
// goog.inherits(goog.structs.PriorityQueue, goog.structs.Heap);


/**
 * Puts the specified value in the queue.
 * @param {number} priority The priority of the value. A smaller value here
 *     means a higher priority.
 * @param {VALUE} value The value.
 */
PriorityQueue.prototype.enqueue = function(priority, value) {
  this.heap.insert(priority, value);
};


/**
 * Retrieves and removes the head of this queue.
 * @return {VALUE} The element at the head of this queue. Returns undefined if
 *     the queue is empty.
 */
PriorityQueue.prototype.dequeue = function() {
  // console.log("this.heap.getCount() from beginning of dequeue():", this.heap.getCount())
  const value = this.heap.remove();
  // console.log("this.heap.getCount() from end of dequeue():", this.heap.getCount())
  return value;
  //  return this.heap.remove();
};
