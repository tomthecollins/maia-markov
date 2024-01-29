//
const plotlib = require('nodeplotlib');
const data = [{x: [1, 3, 4, 5], y: [3, 12, 1, 4], type: 'line'}];
plotlib.stack(data);
plotlib.stack(data);
plotlib.stack(data);
plotlib.plot();
// plotlib.plot(data);

const riff = [
  [0, 66, 63, 2, 0, 84],
  [2, 62, 61, 1, 0, 84],
  [3, 59, 59, 1, 0, 84],
  [4, 66, 63, 2, 0, 84],
  [6, 64, 62, 0.5, 0, 84],
  [6.5, 62, 61, 0.5, 0, 84],
  [7, 64, 62, 1, 0, 84],
  [8, 62, 61, 2, 0, 84],
  [10, 69, 62, 2, 0, 84],
  [12, 62, 61, 2, 0, 84],
  [14, 69, 62, 2, 0, 84]
]
