// Adapted from Google's Closure library.
// https://github.com/google/closure-library/blob/master/closure/goog/structs/node.js#L24
// They'd called it Node, which has dangerous overlap with Node.js and isn't
// very descriptive.

/**
 * A generic immutable node. This can be used in various collections that
 * require a node object for its item (such as a heap).
 * @param {K} key Key.
 * @param {V} value Value.
 * @constructor
 * @template K, V
 */
export default function KeyValuePair(key, value) {
  /**
   * The key.
   * @private {K}
   */
  this.key_ = key;

  /**
   * The value.
   * @private {V}
   */
  this.value_ = value;
};

/**
 * Gets the key.
 * @return {K} The key.
 */
KeyValuePair.prototype.getKey = function() {
  return this.key_;
};


/**
 * Gets the value.
 * @return {V} The value.
 */
KeyValuePair.prototype.getValue = function() {
  return this.value_;
};


/**
 * Clones a node and returns a new node.
 * @return {!goog.structs.Node<K, V>} A new goog.structs.Node with the same
 *     key value pair.
 */
KeyValuePair.prototype.clone = function() {
  return new KeyValuePair(this.key_, this.value_);
};
