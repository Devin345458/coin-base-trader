const { getClass } = require('../../../../classes/strategies/indicatorFinder')
module.exports = {

  friendlyName: 'Strategy Options',

  description: 'Strategy Options.',

  inputs: {
    indicator: {
      type: 'string',
      isIn: ['MA', 'Vmap'],
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'The strategy options'
    },
    error: {
      responseType: 'serverError',
      description: 'Unable to find options'
    }
  },

  fn ({ indicator }, exits) {
    const strategy = getClass(indicator)
    if (!strategy) {
      return exits.error()
    }
    return exits.success({
      options: strategy.options
    })
  }

}
