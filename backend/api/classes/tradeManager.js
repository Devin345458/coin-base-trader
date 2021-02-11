const socketIOClient = require('socket.io-client')
const sailsIOClient = require('sails.io.js')
const Ticker = require('./ticker')
const { createClass } = require('./strategies/indicatorFinder')

class TradeManager {
  runningBots = {}

  io = null
  ticker

  constructor () {
    Ticker.initialize()
  }

  async initialize () {
    await this.loadStrategies()
    this.io = sailsIOClient(socketIOClient)
    this.io.sails.url = 'http://localhost:1337'
    this.io.socket.on('strategy', ({ id, verb, data: strategy }) => {
      sails.log.info('detected change in strategy')
      if (verb === 'delete' || strategy.enabled === false) {
        this.removeStrategy(id)
      } else {
        this.addStrategy(strategy)
      }
    })
    this.io.socket.get('/api/v1/strategy/subscribe')
  }

  async addStrategy (strategy) {
    try {
      const instance = createClass(strategy)
      await instance.initialize()
      Ticker.addSubscription(strategy.coin)

      this.runningBots[strategy.id] = {
        class: instance,
        timeout: setTimeout(() => { instance.que.push(Ticker.getCurrentPrice(strategy.coin)) }, strategy.interval)
      }
    } catch (e) {
      sails.log.error(e.message)
      return
    }

    sails.log.info('Successfully updated/added strategy id:' + strategy.id)
  }

  removeStrategy (id) {
    delete this.runningBots[id]
    sails.log.info('Successfully removed/stopped strategy id:' + id)
  }

  async loadStrategies () {
    /** @type {Array} */
    const strategies = await sails.models.strategy.find().populate('user').decrypt()
    sails.log.info(`Found ${strategies.length} active strategies`)
    strategies.forEach((strategy) => {
      this.addStrategy(strategy)
    })
  }
}

module.exports = TradeManager
