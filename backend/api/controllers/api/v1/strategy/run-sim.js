const { getClass } = require('../../../../classes/strategies/indicatorFinder')

module.exports = {

  friendlyName: 'Run Sim',

  description: 'Run a sim for a strategy',

  inputs: {
    initialBalance: {
      type: 'string',
      required: true
    },
    numberOfDays: {
      type: 'number',
      required: true
    },
    strategy: {
      type: 'ref',
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'The strategy was successfully simulated'
    },
    error: {
      responseType: 'serverError',
      description: 'It didn\'t simulate'
    }
  },

  async fn ({ initialBalance, numberOfDays, strategy }, exits) {
    strategy.user = this.req.user
    const StrategyClass = getClass(strategy.indicator)
    const tradingStrat = new StrategyClass(strategy, true)
    tradingStrat.initialize()
    await tradingStrat.setSim(initialBalance)
    const trades = []

    const candles = await sails.helpers.getPriceHistory(numberOfDays, strategy.coin, this.req.user)

    tradingStrat.on('order', ({ order, positionInfo }) => {
      if (order.side === 'sell') {
        order.profitLoss = order.price * order.size - positionInfo.positionAcquiredCost
      }
      trades.push(order)
    })

    const indicators = {}
    tradingStrat.on('indicators', ({ name, indicator, time }) => {
      if (!indicators[name]) {
        indicators[name] = []
      }
      indicators[name].push({
        time,
        indicator
      })
    })

    for (let i = 0; i < candles.length; i++) {
      await tradingStrat.analyze({
        coin: strategy.coin,
        price: candles[i].close,
        time: candles[i].time,
        volume: candles[i].volume
      })
    }
    const results = {
      candles,
      trades,
      indicators
    }

    return exits.success({
      results
    })
  }

}
