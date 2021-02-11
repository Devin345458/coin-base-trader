module.exports = {

  friendlyName: 'Edit Strategy',

  description: 'Edit strategy.',

  inputs: {
    id: {
      type: 'number',
      required: true
    },
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
    const strategy = await Strategy.updateOne({ id: inputs.id }).set(_.omit(inputs, ['id']))
    if (!strategy) {
      return exits.error()
    }
    return exits.success({
      strategyId: strategy.id
    })
  }

}
