"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Edge;
// Constructor for Edge object
function Edge(_u, _v, _w) {
  // Workaround for JS context peculiarities.
  // var self = this;
  this.u = _u;
  this.v = _v;
  this.w = _w;
  // Possible to return something.
  // return sth;
}
// Methods for Edge object
Edge.prototype = {
  constructor: Edge

  // sth: function(){}
};