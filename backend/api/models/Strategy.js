/**
 * Strategy.js
 *
 * @name global.Strategy
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
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
    user: {
      required: true,
      model: 'user'
    },
    coin: {
      type: 'string',
      required: true
    },
    interval: {
      type: 'number',
      description: 'Set the interval to check trade',
      required: true
    },
    positionInfo: {
      type: 'json',
      description: 'The current state of the trader with details',
      defaultsTo: {}
    },
    profile: {
      type: 'string',
      defaultsTo: 'default'
    },
    depositingEnabled: {
      type: 'boolean',
      defaultsTo: false
    },
    depositingAmount: {
      type: 'number',
      defaultsTo: 0.5
    },

    // Associations
    options: {
      type: 'json'
    },
    trades: {
      collection: 'trades',
      via: 'strategy'
    }
  },
  async afterCreate (newRecord, next) {
    newRecord = await Strategy.findOne({ id: newRecord.id }).populate('user').decrypt()
    sails.sockets.broadcast('strategy', 'strategy', {
      verb: 'create',
      id: newRecord.id,
      data: newRecord
    })
    next()
  },
  async afterUpdate (newRecord, next) {
    newRecord = await Strategy.findOne({ id: newRecord.id }).populate('user').decrypt()
    sails.sockets.broadcast('strategy', 'strategy', {
      verb: 'update',
      id: newRecord.id,
      data: newRecord
    })
    next()
  },
  afterDestroy (destroyedRecord, next) {
    sails.sockets.broadcast('strategy', 'strategy', {
      verb: 'delete',
      id: destroyedRecord.id
    })
    next()
  }
}
