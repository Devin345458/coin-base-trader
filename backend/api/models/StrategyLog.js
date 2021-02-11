/**
 * StrategyLog.js
 *
 * @name global.StrategyLog
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    action: {
      type: 'string',
      isIn: ['tick', 'buy', 'sell', 'info', 'error'],
      required: true,
      description: 'The action being logged'
    },
    text: {
      type: 'string',
      required: true,
      description: 'The text from the log'
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    strategy: {
      model: 'strategy',
      description: 'The strategy logging about'
    }
  },
  afterCreate (newRecord, next) {
    sails.sockets.broadcast('strategy_logs_' + newRecord.strategy, 'newLog', {
      verb: 'create',
      id: newRecord,
      data: newRecord
    })
    next()
  },
  /**
   * Helper function for logging an action
   *
   * @param {String} action
   * @param {String} text
   * @param {Number} strategyId
   * @return {Promise<void>}
   */
  async logAction (action, text, strategyId) {
    try {
      await this.create({
        action,
        text,
        strategy: strategyId
      }).fetch()
      sails.log.info(text)
    } catch (e) {
      sails.log.error(e)
    }
  }

}
