module.exports = {

  friendlyName: 'Get log',

  description: 'Return the trade log ',

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

    const logs = await StrategyLog.find({ strategy: strategyId })

    await sails.sockets.join(this.req, 'strategy_logs_' + strategyId)

    return exits.success({ logs })
  }

}
