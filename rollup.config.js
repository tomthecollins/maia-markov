// import commonjs from 'rollup-plugin-commonjs'

export default {
  input: './es6/maia-markov.js',
  output: {
    file: './maia-markov.js',
    format: 'iife',
    name: 'mm'
  }
  // ,plugins :[ commonjs() ]
}
