const Vmap = require('./crossover_vwap')
const Momentum = require('./momentum')

const strategies = {
  Vmap,
  MA: Momentum
}
module.exports = strategies
