const mm = require('../dist/index');

// const dataEx = [
//   {
//     "city": "farnham",
//     "nbs": [
//       {
//         "city": "aldershot",
//         "dist": 3
//       },
//       {
//         "city": "guildford",
//         "dist": 7
//       }
//     ]
//   },
//   {
//     "city": "aldershot",
//     "nbs": [
//       {
//         "city": "farnham",
//         "dist": 4
//       }
//     ]
//   },
//   {
//     "city": "guildford",
//     "nbs": [
//       {
//         "city": "aldershot",
//         "dist": 3
//       },
//       {
//         "city": "farnham",
//         "dist": 9
//       }
//     ]
//   },
// ]
// let g = new mm.Graph(dataEx, "city", "nbs", "dist")
// console.log("g:", g)
// const path = g.shortest_path("guildford")
// console.log("g.get_vertex('guildford'):", g.get_vertex('guildford'))
// console.log("g.get_vertex('aldershot'):", g.get_vertex('aldershot'))
// console.log("g.get_vertex('farnham'):", g.get_vertex('farnham'))
// const s = g.print_neighbors("farnham")
// console.log("s:", s)
// const nbs = g.get_neighbors("farnham")
// console.log("nbs:", nbs)

const dataEx2 = [
  {
    "vName": "1",
    "nbs": [
      {
        "vName": "6",
        "dist": 14
      },
      {
        "vName": "3",
        "dist": 9
      },
      {
        "vName": "2",
        "dist": 7
      }
    ]
  },
  {
    "vName": "2",
    "nbs": [
      // {
      //   "vName": "1",
      //   "dist": 7
      // },
      {
        "vName": "3",
        "dist": 10
      },
      {
        "vName": "4",
        "dist": 15
      },

    ]
  },
  {
    "vName": "3",
    "nbs": [
      // {
      //   "vName": "1",
      //   "dist": 9
      // },
      // {
      //   "vName": "2",
      //   "dist": 10
      // },
      {
        "vName": "6",
        "dist": 2
      },
      {
        "vName": "4",
        "dist": 11
      }
    ]
  },
  {
    "vName": "4",
    "nbs": [
      // {
      //   "vName": "2",
      //   "dist": 15
      // },
      // {
      //   "vName": "3",
      //   "dist": 11
      // },
      {
        "vName": "5",
        "dist": 6
      },
      // {
      //   "vName": "7",
      //   "dist": 9
      // }
    ]
  },
  {
    "vName": "5",
    "nbs": [
      // {
      //   "vName": "4",
      //   "dist": 6
      // },
      {
        "vName": "6",
        "dist": 9
      },
      // {
      //   "vName": "7",
      //   "dist": 4
      // },
    ]
  },
  {
    "vName": "6",
    "nbs": [
      // {
      //   "vName": "1",
      //   "dist": 14
      // },
      // {
      //   "vName": "3",
      //   "dist": 2
      // },
      // {
      //   "vName": "5",
      //   "dist": 9
      // }
    ]
  },
  // {
  //   "vName": "7",
  //   "nbs": []
  // }
]
let g2 = new mm.Graph()
dataEx2.map(function(d){
  d.nbs.map(function(nb){
    g2.add_edge(d.vName, nb.vName, nb.dist)
  })
})
// g2.scenic_path("1", 0.1)
// console.log("g2:", g2)
// console.log("g2.get_vertex('7'):", g2.get_vertex('7'))
const path2 = g2.print_scenic_path("1", "5", 0.1)
console.log("path2:", path2)
return

const dataEx3 = [
  {
    "vName": "1",
    "nbs": [
      {
        "vName": "6",
        "dist": 14
      },
      {
        "vName": "3",
        "dist": 9
      },
      {
        "vName": "2",
        "dist": 7
      }
    ]
  },
  {
    "vName": "2",
    "nbs": [
      {
        "vName": "3",
        "dist": 10
      }
    ]
  },
  {
    "vName": "3",
    "nbs": [
      {
        "vName": "6",
        "dist": 2
      }
    ]
  },
  {
    "vName": "4",
    "nbs": [
      {
        "vName": "5",
        "dist": 6
      },
      {
        "vName": "7",
        "dist": 9
      }
    ]
  },
  {
    "vName": "5",
    "nbs": [
      {
        "vName": "7",
        "dist": 4
      },
    ]
  },
  {
    "vName": "6",
    "nbs": []
  },
  {
    "vName": "7",
    "nbs": []
  }
]
let g3 = new mm.Graph()
dataEx3.map(function(d){
  d.nbs.map(function(nb){
    g3.add_edge(d.vName, nb.vName, nb.dist)
  })
})
g3.shortest_path("1")
console.log("g3.get_vertex('7'):", g3.get_vertex('7'))
const path3 = g3.print_shortest_path("1", "7")
console.log("path3:", path3)
