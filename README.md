MAIA Markov
==============

Markov-based analysis and generation functions supporting various applications by Music Artificial Intelligence Algorithms, Inc.

## Local Installation

Set yourself up with an installation of [Node.js](https://nodejs.org/). Then open up a terminal window and navigate to a directory where you want to experiment with MAIA Markov.

### User

In the terminal window, execute
```bash
npm install maia-markov --save
```
which should make a node_modules folder that contains MAIA Markov and its dependencies.

Make yourself a new JavaScript (plain-text) file – [Atom](https://atom.io/) is a good editor for such purposes – and copy/paste the first three lines of code from the hello-world example below. Save the file as something like hello_world.js at the same level as node_modules (not inside it).

Return to the terminal and execute
```bash
node hello_world.js
```
which should run the hello_world.js script you just wrote, giving the output
```bash
ans: [0, 0, 0, 2], [0, 7, 4, 1], [1, 9, 5, 0.5], [1.5, 7, 4, 0.5]
```
You have started to use MAIA Markov!

### Developer

With [Node.js](https://nodejs.org/) set up, clone the MAIA Markov repository from [here](https://bitbucket.org/tomthecollins/maia-markov/) and run `npm install` to acquire the dependencies. Some packages, such as Rollup, might need a general install.

Please follow these steps when making additions or changes:

1. Additions or changes to the code should be made in the es6 folder;
2. When documenting, follow the JSDoc format used therein;
3. Write unit tests below each method/function;
4. Execute `npm run compile` to convert the various components in the es6 into the corresponding components in the dist folder, and to combine them into an IIFE (called maia-markov.js, in the root of the repository);
5. Execute `jsdoc --configure .jsdoc.config.js es6` to update the documentation, which gets written to the docs folder, and check it looks good and reads well;
6. Say in step 1 you added a new file to the es6 folder called hello_world.js, then now it's time to check on your unit tests by executing `node hello_world.js` and seeing whether the `console.log()`s match your expected output;
7. Once you are satisfied with your unit tests, comment them out and paste them to test/index.js, following the chai format used therein. Execute `npm test` to verify that there are ticks everywhere and in particular that your new tests are being invoked;
8. Do the usual `git add .`, `git commit -m "Short meaningful message"`, and `git push`, and we'll see it on the other side as a pull request;
9. There should not be any need for you to edit the version in package.json;
10. Please keep any data files out of the repository by editing the .gitignore file.

## Hello-world example

```javascript
const mm = require('maia-markov')
const ps = [
  [0, 60, 60, 2], [0, 67, 64, 1],
  [1, 69, 65, 0.5], [1.5, 67, 64, 0.5]
]
let an = new mm.Analyzer()
const ans = an.centre_point_set([0, 0], ps)
console.log('ans:', ans)
```

## Tests

TBD

## Contributing

TBD

## Release History

* 0.1.9-10 Included of a melody extraction algorithm. 
* 0.1.7-8 Bug fix of protected word "export"
* 0.1.4-6 Added stm and initial distribution construction, pruning and file-writing methods into the Analyzer class.
* 0.1.3 Fixed a bug with coincident channels in MIDI import.
* 0.1.2 Added some extra instruments to extract_vocal().
* 0.1.1 Working on scenic_path().
* 0.0.72-73 Fixed ontime correction bug.
* 0.0.70-71 Switched unique_rows(ps, true) in for sort_rows(ps) in MidiImport, in order to address issue of MIDI files containing duplicate points.
* 0.0.64-69 Use of timelapse objects in new version of MAIA Util, and some debugging of MidiImport's get_points().
* 0.0.63 Better MIDI import/export/import management.
* 0.0.60-62 Added some track-extract methods to the MidiImport class.
* 0.0.57-59 Multitrack MIDI export including control changes.
* 0.0.51-56 Added musicXml property alongside midi property under miscImport, and deprecated miscXml, to conform with the Composition object spec.
* 0.0.50 More imported MIDI properties included in MidiImport, including control changes.
* 0.0.45-49 Corrected an error involving undefined time signatures.
* 0.0.32-44 Working on a new version of XmlImport whose XML converter respects the order of entries.
* 0.0.31 Edited note_point_set2comp_obj() so that quantisation will not be applied if the set of fractions is null.
* 0.0.30 Added a MidiExport class.
* 0.0.29 Fixed bug in comp_obj2beat_mnn_states().
* 0.0.7-28 Working on import capabilities.
* 0.0.6 Tagged for the submission to the AI Music Generation Challenge 2020. Some bug fixes as well, e.g. to get_phrase_boundary_ontimes() in the MidiImport class (this didn't affect the excerpts generated for the listening study).
* 0.0.5 Tagged for Alex's listening study and (separately).
* 0.0.4 Continuing to refactor code from the examples folder into the package itself.
* 0.0.3 Fixed bug in analysis code and refactored analyze.js and generate.js into classes.
* 0.0.2 Many code components still in the wrong places, but wanted to tag a version for generating the material for AI Eurovision 2020.
* 0.0.0 Initial release
