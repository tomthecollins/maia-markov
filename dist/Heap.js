'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Heap;

var _KeyValuePair = require('./KeyValuePair');

var _KeyValuePair2 = _interopRequireDefault(_KeyValuePair);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class for a Heap data structure.
 *
 * @param {goog.structs.Heap|Object=} opt_heap Optional goog.structs.Heap or
 *     Object to initialize heap with.
 * @constructor
 * @template K, V
 */
function Heap(opt_heap) {
  /**
   * The nodes of the heap.
   * @private
   * @type {Array<goog.structs.Node>}
   */
  this.nodes_ = [];

  if (opt_heap) {
    this.insertAll(opt_heap);
  }
} // Adapted from Google's Closure library.
// https://github.com/google/closure-library/blob/master/closure/goog/structs/heap.js#L44

// Imports
;

/**
 * Restores heap order property. This one added by me.
 */
Heap.prototype.heapify = function () {
  for (var i = Math.floor(this.nodes_.length / 2); i >= 0; i--) {
    this.moveDown_(i);
  }
};

/**
 * Removes a specifiable value. This one added by me.
 */
Heap.prototype.removeValue = function (value) {
  var relIdx = this.containsValue(value);
  if (relIdx >= 0) {
    this.nodes_.splice(relIdx, -1);
    this.heapify();
  }
};

/**
 * Insert the given value into the heap with the given key.
 * @param {K} key The key.
 * @param {V} value The value.
 */
Heap.prototype.insert = function (key, value) {
  var node = new _KeyValuePair2.default(key, value);
  var nodes = this.nodes_;
  nodes.push(node);
  this.moveUp_(nodes.length - 1);
};

/**
 * Adds multiple key-value pairs from another goog.structs.Heap or Object
 * @param {goog.structs.Heap|Object} heap Object containing the data to add.
 */
Heap.prototype.insertAll = function (heap) {
  var keys, values;
  if (heap instanceof Heap) {
    keys = heap.getKeys();
    values = heap.getValues();

    // If it is a heap and the current heap is empty, I can rely on the fact
    // that the keys/values are in the correct order to put in the underlying
    // structure.
    if (this.getCount() <= 0) {
      var nodes = this.nodes_;
      for (var i = 0; i < keys.length; i++) {
        nodes.push(new _KeyValuePair2.default(keys[i], values[i]));
      }
      return;
    }
  } else {
    keys = Object.keys(heap);
    values = Object.values(heap);
  }

  for (var i = 0; i < keys.length; i++) {
    this.insert(keys[i], values[i]);
  }
};

/**
 * Retrieves and removes the root value of this heap.
 * @return {V} The value removed from the root of the heap.  Returns
 *     undefined if the heap is empty.
 */
Heap.prototype.remove = function () {
  var nodes = this.nodes_;
  // console.log("this.nodes_.length before removal:", this.nodes_.length)
  var count = nodes.length;
  var rootNode = nodes[0];
  if (count <= 0) {
    return undefined;
  } else if (count == 1) {
    nodes.pop();
    // goog.array.clear(nodes);
  } else {
    nodes[0] = nodes.pop();
    this.moveDown_(0);
  }
  // console.log("this.nodes_.length after removal:", this.nodes_.length)
  return rootNode.getValue();
};

/**
 * Retrieves but does not remove the root value of this heap.
 * @return {V} The value at the root of the heap. Returns
 *     undefined if the heap is empty.
 */
Heap.prototype.peek = function () {
  var nodes = this.nodes_;
  if (nodes.length == 0) {
    return undefined;
  }
  return nodes[0].getValue();
};

/**
 * Retrieves but does not remove the key of the root node of this heap.
 * @return {K} The key at the root of the heap. Returns undefined if the
 *     heap is empty.
 */
Heap.prototype.peekKey = function () {
  return this.nodes_[0] && this.nodes_[0].getKey();
};

/**
 * Moves the node at the given index down to its proper place in the heap.
 * @param {number} index The index of the node to move down.
 * @private
 */
Heap.prototype.moveDown_ = function (index) {
  var nodes = this.nodes_;
  var count = nodes.length;

  // Save the node being moved down.
  var node = nodes[index];
  // While the current node has a child.
  while (index < count >> 1) {
    var leftChildIndex = this.getLeftChildIndex_(index);
    var rightChildIndex = this.getRightChildIndex_(index);

    // Determine the index of the smaller child.
    var smallerChildIndex = rightChildIndex < count && nodes[rightChildIndex].getKey() < nodes[leftChildIndex].getKey() ? rightChildIndex : leftChildIndex;

    // If the node being moved down is smaller than its children, the node
    // has found the correct index it should be at.
    if (nodes[smallerChildIndex].getKey() > node.getKey()) {
      break;
    }

    // If not, then take the smaller child as the current node.
    nodes[index] = nodes[smallerChildIndex];
    index = smallerChildIndex;
  }
  nodes[index] = node;
};

/**
 * Moves the node at the given index up to its proper place in the heap.
 * @param {number} index The index of the node to move up.
 * @private
 */
Heap.prototype.moveUp_ = function (index) {
  var nodes = this.nodes_;
  var node = nodes[index];

  // While the node being moved up is not at the root.
  while (index > 0) {
    // If the parent is less than the node being moved up, move the parent down.
    var parentIndex = this.getParentIndex_(index);
    if (nodes[parentIndex].getKey() > node.getKey()) {
      nodes[index] = nodes[parentIndex];
      index = parentIndex;
    } else {
      break;
    }
  }
  nodes[index] = node;
};

/**
 * Gets the index of the left child of the node at the given index.
 * @param {number} index The index of the node to get the left child for.
 * @return {number} The index of the left child.
 * @private
 */
Heap.prototype.getLeftChildIndex_ = function (index) {
  return index * 2 + 1;
};

/**
 * Gets the index of the right child of the node at the given index.
 * @param {number} index The index of the node to get the right child for.
 * @return {number} The index of the right child.
 * @private
 */
Heap.prototype.getRightChildIndex_ = function (index) {
  return index * 2 + 2;
};

/**
 * Gets the index of the parent of the node at the given index.
 * @param {number} index The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
Heap.prototype.getParentIndex_ = function (index) {
  return index - 1 >> 1;
};

/**
 * Gets the values of the heap.
 * @return {!Array<V>} The values in the heap.
 */
Heap.prototype.getValues = function () {
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for (var i = 0; i < l; i++) {
    rv.push(nodes[i].getValue());
  }
  return rv;
};

/**
 * Gets the keys of the heap.
 * @return {!Array<K>} The keys in the heap.
 */
Heap.prototype.getKeys = function () {
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for (var i = 0; i < l; i++) {
    rv.push(nodes[i].getKey());
  }
  return rv;
};

/**
 * Whether the heap contains the given value.
 * @param {V} val The value to check for.
 * @return {boolean} Whether the heap contains the value.
 */
Heap.prototype.containsValue = function (val) {
  return this.nodes_.findIndex(function (n) {
    return n.getValue() == val;
  });
  // return goog.array.some(
  //     this.nodes_, function(node) { return node.getValue() == val; });
};

/**
 * Whether the heap contains the given key.
 * @param {K} key The key to check for.
 * @return {boolean} Whether the heap contains the key.
 */
Heap.prototype.containsKey = function (key) {
  return this.nodes_.findIndex(function (n) {
    return n.getKey() == key;
  });
  // return goog.array.some(
  //     this.nodes_, function(node) { return node.getKey() == key; });
};

/**
 * Clones a heap and returns a new heap
 * @return {!goog.structs.Heap} A new goog.structs.Heap with the same key-value
 *     pairs.
 */
Heap.prototype.clone = function () {
  return new Heap(this);
};

/**
 * The number of key-value pairs in the map
 * @return {number} The number of pairs.
 */
Heap.prototype.getCount = function () {
  return this.nodes_.length;
};

/**
 * Returns true if this heap contains no elements.
 * @return {boolean} Whether this heap contains no elements.
 */
Heap.prototype.isEmpty = function () {
  return this.nodes_.length == 0;
  // return goog.array.isEmpty(this.nodes_);
};

/**
 * Removes all elements from the heap.
 */
Heap.prototype.clear = function () {
  this.nodes_ = [];
  // goog.array.clear(this.nodes_);
};