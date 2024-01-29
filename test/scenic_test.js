const mm = require("../dist/index")
const sr = require("seed-random")

const dataEx = [
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
    "vName": "6",
    "nbs": [
    ]
  }
]
let g = new mm.Graph(dataEx, "vName", "nbs", "dist")
console.log("Graph loaded.")
// console.log("g:", g)

const seed = "hello"
sr(seed, {global: true})
const ans = g.print_scenic_path("1", "6", 0.5)
console.log("ans:", ans)

const seed2 = "goodbye"
sr(seed2, {global: true})
const ans2 = g.print_scenic_path("1", "6", 0.5)
console.log("ans2:", ans2)
