const mm = require('../dist/index')
const co = new mm.XmlImport("./chopin_ballade_2.xml").compObj//Npo
console.log("co:", co)

// const co = new mm.XmlImport("./short_score.xml").compObj
// console.log("co.layer:", co.layer)
