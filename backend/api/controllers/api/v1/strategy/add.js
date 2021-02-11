module.exports = {

  friendlyName: 'Add',

  description: 'Add strategy.',

  inputs: {
    name: {
      type: 'string',
      required: true
    },
    indicator: {
      type: 'string',
      isIn: ['MA', 'Vmap'],
      required: true
    },
    type: {
      type: 'string',
      isIn: ['Paper', 'Live'],
      required: true
    },
    options: {
      type: 'ref',
      required: true
    },
    coin: {
      type: 'string',
      required: true
    },
    interval: {
      type: 'number',
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'The strategy was successfully added'
    },
    error: {
      responseType: 'serverError',
      description: 'It didn\'t save'
    }
  },

  async fn (inputs, exits) {
    inputs.user = this.req.user.id
    const strategy = await Strategy.create(inputs).fetch()
    if (!strategy) {
      return exits.error()
    }
    return exits.success({
      strategyId: strategy.id
    })
  }

}
