const strategies = require('./indicators')
/**
 *
 * @param strategyIndicator
 * @returns {ObjectConstructor}
 */
module.exports.getClass = (strategyIndicator) => {
  return strategies[strategyIndicator]
}

/**
 *
 * @returns {ObjectConstructor}
 * @param {Object} strategy
 * @param {boolean} sim
 */
module.exports.createClass = (strategy, sim = false) => {
  const Class = this.getClass(strategy.indicator)
  return new Class(strategy, sim)
}

/**
 *
 * @param strategy
 * @param sim
 * @return {Promise<Object>}
 */
module.exports.createAndInitializeClass = async (strategy, sim = false) => {
  const Class = this.createClass(strategy, sim)
  await Class.initialize()
  return Class
}
