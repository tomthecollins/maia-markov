// Constructor for Vertex object
export default function Vertex(_name){
  // Workaround for JS context peculiarities.
  // var self = this;
  this.name = _name
  // Neighbors (nbs) will be an array of Edges.
  this.nbs = []
  // Useful for calculating shortest path
  this.dist = Infinity
  this.visited = false
  this.prev = null // Will be of type Vertex.
  // Possible to return something.
  // return sth;
}
// exports.Vertex = Vertex
// Methods for Vertex object
Vertex.prototype = {
  constructor: Vertex,

  // Currently unused, e.g., because priorities are passed to PQ explicitly.
  compare_to: function(v){
    return this.dist - v.dist
  }
}
