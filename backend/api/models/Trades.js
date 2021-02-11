/**
 * Trades.js
 *
 * @name global.Trades
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    strategy: {
      model: 'strategy',
      description: 'The strategy making the trade',
      required: true
    },
    side: {
      type: 'string',
      isIn: ['buy', 'sell'],
      required: true
    },
    currency: {
      type: 'string',
      required: true
    },
    quantity: {
      type: 'number',
      required: true
    },
    profitLoss: {
      type: 'number',
      allowNull: true
    }
  },
  afterCreate (newRecord, next) {
    sails.sockets.broadcast('trade_' + newRecord.strategy, 'trade', {
      verb: 'create',
      id: newRecord,
      data: newRecord
    })
    next()
  },
  async addTrade (strategyId, side, currency, quantity, profitLoss = null) {
    try {
      await this.create({
        currency,
        side,
        quantity,
        strategy: strategyId,
        profitLoss
      })
    } catch (e) {
      sails.log.error(e)
    }
  }

}
