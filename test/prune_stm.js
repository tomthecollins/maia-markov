const mm = require('../dist/index');
const an = new mm.Analyzer()

// let anStm = [
//   {
//     "mySt": [7],
//     "continuations": [
//       {
//         "mySt": [4],
//         "context": {
//           "piece_id": "b"
//         }
//       },
//       {
//         "mySt": [1],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [1],
//     "continuations": [
//       {
//         "mySt": [2],
//         "context": {
//           "piece_id": "a"
//         }
//       },
//       {
//         "mySt": [7],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   }
// ]
// const ans = an.prune_remover([1], anStm, "mySt")
// console.log("ans:", ans)
// console.log("ans[0].continuations:", ans[0].continuations)


// let anStm1 = [
//   {
//     "mySt": [7],
//     "continuations": [
//       {
//         "mySt": [4],
//         "context": {
//           "piece_id": "b"
//         }
//       },
//       {
//         "mySt": [1],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [1],
//     "continuations": [
//       {
//         "mySt": [2],
//         "context": {
//           "piece_id": "a"
//         }
//       },
//       {
//         "mySt": [7],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [8],
//     "continuations": [
//       {
//         "mySt": [5],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [5],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [3],
//     "continuations": [
//       {
//         "mySt": [6],
//         "context": {
//           "piece_id": "c"
//         }
//       },
//       {
//         "mySt": [9],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [6],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   }
// ]
// const ans1 = an.prune_helper(anStm1[1], anStm1, "mySt", 2)
// console.log("ans1:", ans1)
// // console.log("anStm1:", anStm1)
// // anStm1.map(function(sc){
// //   console.log("sc.continuations:", sc.continuations)
// // })
//
// const ans15 = an.prune_helper(anStm1[2], anStm1, "mySt", 2)
// console.log("ans15:", ans15)
// // console.log("anStm1:", anStm1)
// // anStm1.map(function(sc){
// //   console.log("sc.continuations:", sc.continuations)
// // })
//
// const ans16 = an.prune_helper(anStm1[5], anStm1, "mySt", 2)
// console.log("ans16:", ans16)
// // console.log("anStm1:", anStm1)
// // anStm1.map(function(sc){
// //   console.log("sc.continuations:", sc.continuations)
// // })


// let anStm2 = [
//   {
//     "mySt": [7],
//     "continuations": [
//       {
//         "mySt": [4],
//         "context": {
//           "piece_id": "b"
//         }
//       },
//       {
//         "mySt": [1],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [1],
//     "continuations": [
//       {
//         "mySt": [2],
//         "context": {
//           "piece_id": "a"
//         }
//       },
//       {
//         "mySt": [7],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [8],
//     "continuations": [
//       {
//         "mySt": [5],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [5],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [3],
//     "continuations": [
//       {
//         "mySt": [6],
//         "context": {
//           "piece_id": "c"
//         }
//       },
//       {
//         "mySt": [9],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [6],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   }
// ]
// const ans2 = an.prune_stm(anStm2, "mySt", 2)
// console.log("ans2:", ans2)

// let anStm3 = [
//   {
//     "mySt": [7],
//     "continuations": [
//       {
//         "mySt": [4],
//         "context": {
//           "piece_id": "b"
//         }
//       },
//       {
//         "mySt": [1],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [1],
//     "continuations": [
//       {
//         "mySt": [2],
//         "context": {
//           "piece_id": "a"
//         }
//       },
//       {
//         "mySt": [7],
//         "context": {
//           "piece_id": "a"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [8],
//     "continuations": [
//       {
//         "mySt": [5],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [5],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [3],
//     "continuations": [
//       {
//         "mySt": [6],
//         "context": {
//           "piece_id": "c"
//         }
//       },
//       {
//         "mySt": [9],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   },
//   {
//     "mySt": [6],
//     "continuations": [
//       {
//         "mySt": [3],
//         "context": {
//           "piece_id": "c"
//         }
//       }
//     ]
//   }
// ]
// const ans3 = an.prune_stm(anStm3, "mySt", 3)
// console.log("ans3:", ans3)
// ans3.map(function(sc){
//   console.log("sc.continuations:", sc.continuations)
// })

let anStm4 = [
  {
    "mySt": [7],
    "continuations": [
      {
        "mySt": [4],
        "context": {
          "piece_id": "b"
        }
      },
      {
        "mySt": [1],
        "context": {
          "piece_id": "a"
        }
      }
    ]
  },
  {
    "mySt": [1],
    "continuations": [
      {
        "mySt": [2],
        "context": {
          "piece_id": "a"
        }
      },
      {
        "mySt": [7],
        "context": {
          "piece_id": "a"
        }
      }
    ]
  },
  {
    "mySt": [8],
    "continuations": [
      {
        "mySt": [5],
        "context": {
          "piece_id": "c"
        }
      }
    ]
  },
  {
    "mySt": [5],
    "continuations": [
      {
        "mySt": [3],
        "context": {
          "piece_id": "c"
        }
      }
    ]
  },
  {
    "mySt": [3],
    "continuations": [
      {
        "mySt": [6],
        "context": {
          "piece_id": "c"
        }
      },
      {
        "mySt": [9],
        "context": {
          "piece_id": "c"
        }
      }
    ]
  },
  {
    "mySt": [6],
    "continuations": [
      {
        "mySt": [3],
        "context": {
          "piece_id": "c"
        }
      }
    ]
  }
]
const prm = { "stateType": "mySt", "nosConsecutives": 2 }
const ans4 = an.prune_stm(anStm4, prm)
console.log("\n\n")
ans4.map(function(sc){
  console.log("sc.mySt:", sc.mySt)
  console.log("sc.continuations:", sc.continuations)
})
