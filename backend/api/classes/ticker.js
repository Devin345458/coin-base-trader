const EventEmitter = require('events')
const CoinbasePro = require('coinbase-pro')

const websocketURI = 'wss://ws-feed.pro.coinbase.com'
const websocketSandboxURI = 'wss://ws-feed-public.sandbox.pro.coinbase.com'

module.exports = class Ticker extends EventEmitter {
  static init
  prices = {}

  static getTicker () {
    this.initialize()
    return this.init
  }

  static initialize () {
    if (!this.init) {
      this.init = new this()
    }
  }

  constructor () {
    super()
    this.coins = []
    this.websocketURI = process.env.NODE_ENV === 'production' ? websocketURI : websocketSandboxURI
    this.websocket = null
  }

  /**
   * Creates the websocket object and turns it on to update the currentPrice
   */
  connect () {
    sails.log.info('Initializing ticker connect')
    this.websocket = new CoinbasePro.WebsocketClient(
      this.coins,
      this.websocketURI,
      {},
      {
        channels: ['ticker']
      }
    )
    // turn on the websocket for errors
    this.websocket.on('error', (err) => {
      const message = 'Error occurred in the websocket.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
      this.connect()
    })

    // Turn on the websocket for closes to restart it
    this.websocket.on('close', () => {
      sails.log.debug('WebSocket closed, restarting...')
      this.connect()
    })

    // Turn on the websocket for messages
    this.websocket.on('message', (data) => {
      if (data.type === 'ticker') {
        sails.log.debug(`Ticker price for ${data.product_id}: ${data.price}`)
        // Save the data to the database
        sails.models.ticker.createFromTicker(data)
        this.emit(data.coin, data)
        this.prices[data.product_id] = data.price
      }
    })
  }

  static addSubscription (coin) {
    const ticker = this.getTicker()
    ticker.addSubscription(coin)
  }

  addSubscription (coin) {
    // Prevent duplicate coin subscriptions
    if (this.coins.includes(coin)) {
      return
    }
    this.coins.push(coin)
    if (this.coins.length === 1) {
      this.connect()
      return
    }
    sails.log.info('Adding ticker coin')
    this.websocket.subscribe({
      channels: [
        {
          name: 'ticker',
          product_ids: [coin]
        }
      ]
    })
  }

  static getCurrentPrice (coin) {
    return this.getTicker().prices[coin]
  }
}
