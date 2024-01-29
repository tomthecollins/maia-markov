const mm = require('../dist/index');

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
console.log("g:", g)

const ans = g.print_scenic_path("1", "6")
console.log("ans:", ans)
