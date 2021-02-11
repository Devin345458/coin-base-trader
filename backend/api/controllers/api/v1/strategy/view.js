module.exports = {

  friendlyName: 'View Strategy',

  description: 'Get a strategy by id.',

  inputs: {
    id: {
      type: 'number',
      required: true
    },
    trades: {
      type: 'boolean',
      default: false
    }
  },

  exits: {
    success: {
      responseType: 'ok'
    }
  },

  async fn ({ id, trades }, exits) {
    const query = Strategy.findOne({ id })
    if (trades) {
      query.populate('trades')
    }
    const strategy = await query
    if (!strategy) {
      return this.res.serverError()
    }
    return exits.success({ strategy })
  }

}
