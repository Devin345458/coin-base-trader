module.exports = {

  friendlyName: 'Get trades',

  description: 'Return the trades for the strategy',

  inputs: {
    strategyId: {
      type: 'number',
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'ok'
    },
    notSocket: {
      responseType: 'badRequest'
    }
  },

  async fn ({ strategyId }, exits) {
    // Make sure this is a socket request (not traditional HTTP)
    if (!this.req.isSocket) {
      return exits.notSocket()
    }

    const trades = await Trades.find({ strategy: strategyId })

    await sails.sockets.join(this.req, 'trades_' + strategyId)

    return exits.success({ trades })
  }

}
