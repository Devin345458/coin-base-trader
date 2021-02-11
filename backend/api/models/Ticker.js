/**
 * Ticker.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    coin: {
      type: 'string',
      required: true,
      description: 'The crypto coin currency pair id i.e. BTC-USD'
    },
    price: {
      type: 'number',
      required: true,
      description: 'The current price of the crypto currency i.e. 35199.24'
    },
    open24h: {
      type: 'number',
      required: true,
      description: ''
    },
    volume24h: {
      type: 'number',
      required: true,
      description: ''
    },
    low24h: {
      type: 'number',
      required: true,
      description: ''
    },
    high24h: {
      type: 'number',
      required: true,
      description: ''
    },
    volume30d: {
      type: 'number',
      required: true,
      description: ''
    },
    bestBid: {
      type: 'number',
      required: true,
      description: ''
    },
    bestAsk: {
      type: 'number',
      required: true,
      description: ''
    },
    side: {
      type: 'string',
      required: true,
      description: ''
    },
    time: {
      type: 'string',
      required: true,
      description: ''
    },
    tradeId: {
      type: 'number',
      required: true,
      description: ''
    },
    lastSize: {
      type: 'number',
      required: true,
      description: ''
    }
  },
  createFromTicker (data) {
    data.coin = data.product_id
    data.open24h = data.open_24h
    data.volume24h = data.volume_24h
    data.low24h = data.low_24h
    data.high24h = data.high_24h
    data.volume30d = data.volume_30d
    data.bestBid = data.best_bid
    data.bestAsk = data.best_ask
    data.tradeId = data.trade_id
    data.lastSize = data.last_size
    sails.models.ticker.create(data).then().catch((e) => {
      sails.log.error(e)
    })
  }

}
