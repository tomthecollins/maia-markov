// Imports
import Vertex from './Vertex'
import Edge from './Edge'
import PriorityQueue from './PriorityQueue'
const mu = require('maia-util')

// Constructor for Graph object
export default function Graph(arr, vtxStr, nbsStr, distStr){
  // If supplied with an input array, this constructor fills the graph with
  // directed edges by default.
  this.vertexMap = {}
  // Workaround for JS context peculiarities.
  var self = this;
  if (arr !== undefined){
    arr.map(function(a){
      a[nbsStr].map(function(n){
        if (distStr !== undefined){
          self.add_directed_edge(a[vtxStr], n[vtxStr], n[distStr])
        }
        else {
          self.add_directed_edge(a[vtxStr], n[vtxStr], 1)
        }
      })
    })
  }
  // Possible to return something.
  // return sth;
}
// Methods for Graph object
Graph.prototype = {
  constructor: Graph,

  add_edge: function(start, end, w){
    const u = this.get_vertex(start)
    const v = this.get_vertex(end)
    u.nbs.push(new Edge(u, v, w))
    v.nbs.push(new Edge(v, u, w))
  },

  add_directed_edge: function(start, end, w){
    const u = this.get_vertex(start)
    const v = this.get_vertex(end)
    u.nbs.push(new Edge(u, v, w))
  },

  get_vertex: function(name){
    let v = this.vertexMap[name]
    if (v == undefined){
      v = new Vertex(name)
      this.vertexMap[name] = v
    }
    return v
  },

  get_neighbors: function(name){
    let v = this.vertexMap[name]
    if (v == undefined){
      console.log("Error: start vertex not found.")
      return
    }
    return v.nbs.map(function(nb){
      return nb.v.name
    })
  },

  print_neighbors: function(name){
    let v = this.vertexMap[name]
    if (v == undefined){
      console.log("Error: start vertex not found.")
      return
    }
    let str = ""
    v.nbs.map(function(nb){
      str += nb.v.name + ", "
    })
    return str
  },

  // Could write one of these, because there's too much code copy/paste at the
  // beginnings of bfs, dfs, and shortest_path below.
  // prep_for_search: function(startName){}

  // Untested breadth-first search
  bfs: function(startName){
    let startVertex = this.vertexMap[startName]
    if (startVertex == undefined){
      console.log("Error: start vertex not found.")
      return
    }

    this.reset()
    startVertex.dist = 0
    let dq = [startVertex]
    while (dq.length > 0){
      const u = dq.shift()
      console.log(u.name + " " + u.dist)
      u.nbs.map(function(nb){
        let v = nb.v
        if (v.dist == Infinity){
          v.dist = u.dist + 1
          dq.push(v)
        }
      })
    }
  },

  // Untested depth-first search
  dfs: function(startName){
    let startVertex = this.vertexMap[startName]
    if (startVertex == undefined){
      console.log("Error: start vertex not found.")
      return
    }

    this.reset()
    startVertex.visited = true
    let dq = [startVertex]
    while (dq.length > 0){
      const u = dq.pop()
      console.log(u.name)
      u.nbs.map(function(nb){
        let v = nb.v
        if (!v.visited){
          v.visited = true
          dq.push(v)
        }
      })
    }
  },

  // Untested recursive depth-first search
  // No reseting here, which is a potential problem.
  recursive_dfs: function(u){
    u.visited = true
    console.log(u.name)
    u.nbs.map(function(nb){
      let v = nb.v
      if (!v.visited){
        this.recursive_dfs(v)
      }
    })
  },

  shortest_path: function(startName){
    let startVertex = this.vertexMap[startName]
    if (startVertex == undefined){
      console.log("Error: start vertex not found.")
      return
    }

    this.reset()
    let q = new PriorityQueue()
    startVertex.dist = 0
    q.enqueue(startVertex.dist, startVertex)
    // console.log("q:", q)

    while (!q.heap.isEmpty()){
      let u = q.dequeue()
      if (u.visited) continue
      u.visited = true
      // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
      u.nbs.map(function(nb){
        let v = nb.v
        if (v.dist > u.dist + nb.w){
          q.heap.removeValue(v)
          v.dist = u.dist + nb.w
          v.prev = u
          q.enqueue(v.dist, v)
        }
      })
    }
  },

  print_shortest_path: function(startName, endName){
    this.shortest_path(startName)
    let relVtx = this.get_vertex(endName)
    if (!relVtx.visited){
      // These two vertices are not connected.
      return
    }
    let rv = [endName]
    while (relVtx.prev !== null){
      rv.push(relVtx.prev.name)
      relVtx = this.get_vertex(relVtx.prev.name)
    }
    return rv.reverse()
  },

  scenic_path: function(startName, loveOfScenery){
    let startVertex = this.vertexMap[startName]
    if (startVertex == undefined){
      console.log("Error: start vertex not found.")
      return
    }

    this.reset()
    let q = new PriorityQueue()
    startVertex.dist = 0
    q.enqueue(startVertex.dist, startVertex)
    // console.log("q:", q)

    while (!q.heap.isEmpty()){
      let u = q.dequeue()
      if (u.visited) continue
      u.visited = true
      // console.log(u.name + " " + u.dist + " " + ((u.prev==null)?"":u.prev.name))
      u.nbs.map(function(nb){
        let v = nb.v
        if (
          // The next line is intended to avoid the undefined error in beginning
          // to construct the shortest path.
          v.dist === Infinity ||
          (
            // If true, there's a better way to get to vertex v.
            (v.dist > u.dist + nb.w) &&
            Math.random() <= loveOfScenery
          )
        ){
          // Update the heap with the more efficient route.
          q.heap.removeValue(v)
          v.dist = u.dist + nb.w
          v.prev = u
          q.enqueue(v.dist, v)
        }
      })
    }
  },

  print_scenic_path: function(startName, endName, loveOfScenery){
    this.scenic_path(startName, loveOfScenery)
    let relVtx = this.get_vertex(endName)
    if (!relVtx.visited){
      // These two vertices are not connected.
      return
    }
    let rv = [endName]
    while (relVtx.prev !== null){
      rv.push(relVtx.prev.name)
      relVtx = this.get_vertex(relVtx.prev.name)
    }
    return rv.reverse()
  },

  reset: function(){
    let self = this
    Object.keys(this.vertexMap).map(function(v){
      self.vertexMap[v].dist = Infinity
      self.vertexMap[v].visited = false
      self.vertexMap[v].prev = null
    })
  }


}
