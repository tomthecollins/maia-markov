'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Graph;

var _Vertex = require('./Vertex');

var _Vertex2 = _interopRequireDefault(_Vertex);

var _Edge = require('./Edge');

var _Edge2 = _interopRequireDefault(_Edge);

var _PriorityQueue = require('./PriorityQueue');

var _PriorityQueue2 = _interopRequireDefault(_PriorityQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mu = require('maia-util');

// Constructor for Graph object
// Imports
function Graph(arr, vtxStr, nbsStr, distStr) {
  // If supplied with an input array, this constructor fills the graph with
  // directed edges by default.
  this.vertexMap = {};
  // Workaround for JS context peculiarities.
  var self = this;
  if (arr !== undefined) {
    arr.map(function (a) {
      a[nbsStr].map(function (n) {
        if (distStr !== undefined) {
          self.add_directed_edge(a[vtxStr], n[vtxStr], n[distStr]);
        } else {
          self.add_directed_edge(a[vtxStr], n[vtxStr], 1);
        }
      });
    });
  }
  // Possible to return something.
  // return sth;
}
// Methods for Graph object
Graph.prototype = {
  constructor: Graph,

  add_edge: function add_edge(start, end, w) {
    var u = this.get_vertex(start);
    var v = this.get_vertex(end);
    u.nbs.push(new _Edge2.default(u, v, w));
    v.nbs.push(new _Edge2.default(v, u, w));
  },

  add_directed_edge: function add_directed_edge(start, end, w) {
    var u = this.get_vertex(start);
    var v = this.get_vertex(end);
    u.nbs.push(new _Edge2.default(u, v, w));
  },

  get_vertex: function get_vertex(name) {
    var v = this.vertexMap[name];
    if (v == undefined) {
      v = new _Vertex2.default(name);
      this.vertexMap[name] = v;
    }
    return v;
  },

  get_neighbors: function get_neighbors(name) {
    var v = this.vertexMap[name];
    if (v == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }
    return v.nbs.map(function (nb) {
      return nb.v.name;
    });
  },

  print_neighbors: function print_neighbors(name) {
    var v = this.vertexMap[name];
    if (v == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }
    var str = "";
    v.nbs.map(function (nb) {
      str += nb.v.name + ", ";
    });
    return str;
  },

  // Could write one of these, because there's too much code copy/paste at the
  // beginnings of bfs, dfs, and shortest_path below.
  // prep_for_search: function(startName){}

  // Untested breadth-first search
  bfs: function bfs(startName) {
    var startVertex = this.vertexMap[startName];
    if (startVertex == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }

    this.reset();
    startVertex.dist = 0;
    var dq = [startVertex];

    var _loop = function _loop() {
      var u = dq.shift();
      console.log(u.name + " " + u.dist);
      u.nbs.map(function (nb) {
        var v = nb.v;
        if (v.dist == Infinity) {
          v.dist = u.dist + 1;
          dq.push(v);
        }
      });
    };

    while (dq.length > 0) {
      _loop();
    }
  },

  // Untested depth-first search
  dfs: function dfs(startName) {
    var startVertex = this.vertexMap[startName];
    if (startVertex == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }

    this.reset();
    startVertex.visited = true;
    var dq = [startVertex];
    while (dq.length > 0) {
      var _u = dq.pop();
      console.log(_u.name);
      _u.nbs.map(function (nb) {
        var v = nb.v;
        if (!v.visited) {
          v.visited = true;
          dq.push(v);
        }
      });
    }
  },

  // Untested recursive depth-first search
  // No reseting here, which is a potential problem.
  recursive_dfs: function recursive_dfs(u) {
    u.visited = true;
    console.log(u.name);
    u.nbs.map(function (nb) {
      var v = nb.v;
      if (!v.visited) {
        this.recursive_dfs(v);
      }
    });
  },

  shortest_path: function shortest_path(startName) {
    var startVertex = this.vertexMap[startName];
    if (startVertex == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }

    this.reset();
    var q = new _PriorityQueue2.default();
    startVertex.dist = 0;
    q.enqueue(startVertex.dist, startVertex);
    // console.log("q:", q)

    var _loop2 = function _loop2() {
      var u = q.dequeue();
      if (u.visited) return 'continue';
      u.visited = true;
      // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
      u.nbs.map(function (nb) {
        var v = nb.v;
        if (v.dist > u.dist + nb.w) {
          q.heap.removeValue(v);
          v.dist = u.dist + nb.w;
          v.prev = u;
          q.enqueue(v.dist, v);
        }
      });
    };

    while (!q.heap.isEmpty()) {
      var _ret2 = _loop2();

      if (_ret2 === 'continue') continue;
    }
  },

  print_shortest_path: function print_shortest_path(startName, endName) {
    this.shortest_path(startName);
    var relVtx = this.get_vertex(endName);
    if (!relVtx.visited) {
      // These two vertices are not connected.
      return;
    }
    var rv = [endName];
    while (relVtx.prev !== null) {
      rv.push(relVtx.prev.name);
      relVtx = this.get_vertex(relVtx.prev.name);
    }
    return rv.reverse();
  },

  scenic_path: function scenic_path(startName, loveOfScenery) {
    var startVertex = this.vertexMap[startName];
    if (startVertex == undefined) {
      console.log("Error: start vertex not found.");
      return;
    }

    this.reset();
    var q = new _PriorityQueue2.default();
    startVertex.dist = 0;
    q.enqueue(startVertex.dist, startVertex);
    // console.log("q:", q)

    var _loop3 = function _loop3() {
      var u = q.dequeue();
      if (u.visited) return 'continue';
      u.visited = true;
      // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
      u.nbs.map(function (nb) {
        var v = nb.v;
        if (
        // The next line is intended to avoid the undefined error in beginning
        // to construct the shortest path.
        v.dist === Infinity ||
        // If true, there's a better way to get to vertex v.
        v.dist > u.dist + nb.w && Math.random() > loveOfScenery) {
          // Update the heap with the more efficient route.
          q.heap.removeValue(v);
          v.dist = u.dist + nb.w;
          v.prev = u;
          q.enqueue(v.dist, v);
        }
      });
    };

    while (!q.heap.isEmpty()) {
      var _ret3 = _loop3();

      if (_ret3 === 'continue') continue;
    }
  },

  print_scenic_path: function print_scenic_path(startName, endName, loveOfScenery) {
    this.scenic_path(startName, loveOfScenery);
    var relVtx = this.get_vertex(endName);
    if (!relVtx.visited) {
      // These two vertices are not connected.
      return;
    }
    var rv = [endName];
    while (relVtx.prev !== null) {
      rv.push(relVtx.prev.name);
      relVtx = this.get_vertex(relVtx.prev.name);
    }
    return rv.reverse();
  },

  reset: function reset() {
    var self = this;
    Object.keys(this.vertexMap).map(function (v) {
      self.vertexMap[v].dist = Infinity;
      self.vertexMap[v].visited = false;
      self.vertexMap[v].prev = null;
    });
  }

};