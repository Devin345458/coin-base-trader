const EventEmitter = require('events')
const CoinbasePro = require('coinbase-pro')
const queue = require('async/queue')
const CoinbaseProLibrary = require('./coinbaseProLibrary')

/**
 * The base class for all trading strategies. Contains all logic universal to all strategies
 */
class Trader extends EventEmitter {
  authedClient
  strategy
  accountIds = {}
  apiURI = process.env.NODE_ENV === 'production' ? sails.config.coinbase.apiURI : sails.config.coinbase.sandboxURI
  depositProfileName = 'default'
  balanceMinimum = 0.06
  coinbaseLibObject
  first = false
  highestFee = null
  que = queue(this.analyze.bind(this), 1)
  tradeInProgress = false
  tradeHistory = []
  sim = false
  activeAccountBalance = 0
  orders = []
  positionInfo = {
    positionExists: false
  }


  constructor (strategy) {
    super()
    this.strategy = strategy
    if (this.strategy.type === 'Paper') {
      this.apiURI = sails.config.coinbase.sandboxURI
    }
    this.coinbaseLibObject = new CoinbaseProLibrary(strategy.user, strategy.type)

    Object.keys(strategy.options).forEach((key) => {
      strategy[key] = strategy.options[key]
    })

    this._createClient()
  }

  async initialize () {
    // Retrieve product information:
    this.productInfo = await this.getProductInfo()

    // Retrieve account IDs:
    this.accountIDs = await this.getAccountIDs()

    // Check for an existing positionData file to start the bot with:
    if (!_.isEmpty(this.strategy.positionInfo)) {
      this.positionInfo = this.strategy.positionInfo
    }
  }

  async setSim (initialBalance, highestFee = false) {
    this.sim = true
    this.positionInfo = {
      positionExists: false
    }
    this.activeAccountBalance = initialBalance
    if (!highestFee) {
      this.highestFee = await this.returnHighestFee()
    } else {
      this.highestFee = highestFee
    }
  }

  _createClient () {
    this.authedClient = new CoinbasePro.AuthenticatedClient(
      this.strategy.type === 'Paper' ? this.strategy.user.paperCoinBaseApiKey : this.strategy.user.coinBaseApiKey,
      this.strategy.type === 'Paper' ? this.strategy.user.paperCoinBaseApiSecret : this.strategy.user.coinBaseApiSecret,
      this.strategy.type === 'Paper' ? this.strategy.user.paperCoinBaseApiPhrase : this.strategy.user.coinBaseApiPhrase,
      this.apiURI
    )
  }

  /**
   * Acquires some account ID information to be used for storing and retrieving information and depositing funds after a sell.
   *
   * @return {Object} accountObject contains the needed account IDs and profile IDs needed for checking balances and making transfers
   */
  async getAccountIDs () {

    if (sails.cache.has(this.strategy.id + '_accountObject')) {
      return sails.cache.get(this.strategy.id + '_accountObject')
    }
    try {
      const accountObject = {}

      // Gets the account IDs for the product pairs in the portfolio
      const accounts = await this.authedClient.getAccounts()

      const baseCurrency = this.strategy.coin.split('-')[0]
      const quoteCurrency = this.strategy.coin.split('-')[1]
      for (let i = 0; i < accounts.length; ++i) {
        if (accounts[i].currency === baseCurrency) {
          accountObject.baseCurrencyAccountID = accounts[i].id
        } else if (accounts[i].currency === quoteCurrency) {
          accountObject.quoteCurrencyAccountID = accounts[i].id
        }
      }

      // Gets all the profiles belonging to the user and matches the deposit and trading profile IDs
      const profiles = await this.coinbaseLibObject.getProfiles()

      for (let i = 0; i < profiles.length; ++i) {
        if (profiles[i].name === this.depositProfileName) {
          accountObject.depositProfileID = profiles[i].id
        }
        if (profiles[i].name === this.strategy.profile) {
          accountObject.tradeProfileID = profiles[i].id
        }
      }

      if (!accountObject.depositProfileID) {
        throw new Error(`Could not find the deposit profile ID. Ensure that the depositProfileName: "${this.depositProfileName}" is spelt correctly.`)
      }
      if (!accountObject.tradeProfileID) {
        throw new Error(`Could not find the trade profile ID. Ensure that the tradingProfileName: "${this.strategy.profile}" is spelt correctly.`)
      }

      sails.cache.set(this.strategy.id + '_accountObject', accountObject)
      return accountObject
    } catch (err) {
      const message = 'Error occured in getAccountIDs method.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
      throw err
    }
  }

  /**
   * Gets information about the product being traded that the bot can use to determine how
   * accurate the size and quote values for the order needs to be. This method parses the base and quote increment
   * strings in order to determine to what precision the size and price parameters need to be when placing an order.
   *
   */
  async getProductInfo () {
    if (sails.cache.has(this.strategy.id + '_productData')) {
      return sails.cache.get(this.strategy.id + '_productData')
    }
    try {
      let quoteIncrementRoundValue = 0
      let baseIncrementRoundValue = 0
      let productData

      const products = await this.authedClient.getProducts()

      for (let i = 0; i < products.length; ++i) {
        if (products[i].id === this.strategy.coin) {
          productData = products[i]
        }
      }

      if (productData === undefined) {
        Error(`Error, could not find a valid matching product pair for "${this.strategy.coin}". Verify the product names is correct/exists.`)
      }

      for (let i = 2; i < productData.quote_increment.length; ++i) {
        if (productData.quote_increment[i] === '1') {
          quoteIncrementRoundValue++
          break
        } else {
          quoteIncrementRoundValue++
        }
      }

      if (productData.base_increment[0] !== '1') {
        for (let i = 2; i < productData.base_increment.length; ++i) {
          if (productData.base_increment[i] === '1') {
            baseIncrementRoundValue++
            break
          } else {
            baseIncrementRoundValue++
          }
        }
      }

      productData.quoteIncrementRoundValue = Number(quoteIncrementRoundValue)
      productData.baseIncrementRoundValue = Number(baseIncrementRoundValue)
      await sails.cache.set(this.strategy.id + '_productData', productData)
      return productData
    } catch (err) {
      const message = 'Error occurred in getProductInfo method.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
      throw err
    }
  }

  /**
   * @param {Number} priceToSell
   * @param {Object} ticker
   */
  async sellPosition (priceToSell, ticker = {}) {
    // If there is already a trade waiting to settle return
    if (this.tradeInProgress) {
      return
    }

    // Calculate the order size
    let orderSize
    if (this.productInfo.baseIncrementRoundValue === 0) {
      orderSize = Math.trunc(this.activeAccountBalance)
    } else {
      orderSize = Number(this.activeAccountBalance).toFixed(this.productInfo.baseIncrementRoundValue)
    }

    // The order params for the coinbase api request
    const orderParams = {
      side: 'sell',
      price: priceToSell,
      size: orderSize,
      // eslint-disable-next-line camelcase
      product_id: this.strategy.coin,
      // eslint-disable-next-line camelcase
      time_in_force: 'FOK'
    }

    // If simulating set the account balance and emit the order
    if (this.sim) {
      this.emit('order', { order: { ...orderParams, time: ticker.time }, positionInfo: this.positionInfo })
      this.orders.push({ ...orderParams, time: ticker.time, profitLoss: orderParams.price * orderParams.size - this.positionInfo.positionAcquiredCost })
      this.positionInfo.positionExists = false
      this.activeAccountBalance = orderSize * priceToSell
      return
    }

    // Place sell order with coinbase api
    const order = await this.authedClient.placeOrder(orderParams)

    // Mark the trade as in progress until coinbase tells us they have settled
    this.tradeInProgress = true

    StrategyLog.logAction('info', 'Checking sell order result...', this.strategy.id)

    // Loop to wait for order to be filled:
    for (let i = 0; i < 10 && this.positionInfo.positionExists === true; ++i) {
      let orderDetails
      await sails.helpers.flow.pause(6000) // wait 6 seconds
      try {
        orderDetails = await this.authedClient.getOrder(order.id) // Get latest order details
      } catch (err) {
        const message = 'Error occurred when attempting to get the order.'
        const errorMsg = new Error(err)
        await StrategyLog.logAction('error', message, this.strategy.id)
        await StrategyLog.logAction('error', errorMsg.body, this.strategy.id)
        continue
      }
      sails.log.debug(orderDetails)

      if (orderDetails.status === 'done') {
        if (orderDetails.done_reason !== 'filled') {
          StrategyLog.logAction('error', 'Sell order did not complete due to being filled? done_reason: ' + orderDetails.done_reason, this.strategy.id)
          throw new Error('Sell order did not complete due to being filled? done_reason: ' + orderDetails.done_reason)
        } else {
          this.tradeInProgress = false
          this.positionInfo.positionExists = false

          // Update positionData file:
          await sails.models.strategy.updateOne({ id: this.strategy.id }).set({ positionInfo: this.positionInfo })

          const profit = parseFloat(orderDetails.executed_value) - parseFloat(orderDetails.fill_fees) - this.positionInfo.positionAcquiredCost
          await StrategyLog.logAction(
            'buy',
            `Successfully sold ${orderSize} ${this.productInfo.base_currency} for ${priceToSell} with a PNL of ${profit}`,
            this.strategy.id
          )
          await Trades.addTrade(this.strategy.id, 'sell', this.productInfo.quote_currency, orderSize, profit)

          if (profit > 0) {
            // Check deposit config:
            if (this.depositingEnabled) {
              const transferAmount = (profit * this.depositingAmount).toFixed(2)
              const currency = this.productInfo.quoteCurrency

              // Transfer funds to depositProfileID
              const transferResult = await this.coinbaseLibObject.profileTransfer(this.accountIds.tradeProfileID, this.accountIds.depositProfileID, currency, transferAmount)

              StrategyLog.logAction('info', 'transfer result: ' + transferResult, this.strategy.id)
            }
          } else {
            StrategyLog.logAction('error', 'Sell was not profitable. profit: ' + profit, this.strategy.id)
          }
        }
      }
    }

    // Check if order wasn't filled and needs cancelled:
    if (this.positionInfo.positionExists === true) {
      this.tradeInProgress = false
      const cancelOrder = await this.authedClient.cancelOrder(order.id)
      if (cancelOrder !== order.id) {
        StrategyLog.logAction('error', 'Attempted to cancel failed order but it did not work. cancelOrderReturn: ' + cancelOrder + 'orderID: ' + order.id, this.strategy.id)
        throw new Error('Attempted to cancel failed order but it did not work. cancelOrderReturn: ' + cancelOrder + 'orderID: ' + order.id)
      }
    }
  }

  /**
   * This method places a buy limit order and loops waiting for it to be filled. Once filled it will update the positionInfo and end. If the
   * order ends for a reason other then filled it will throw an exception. If the order doesn't get filled after 1 minute it will cancel the
   * order and throw an exception.
   *
   * @param {Number} priceToBuy
   * @param {Object} ticker
   */
  async buyPosition (priceToBuy, ticker = {}) {
    try {
      if (this.tradeInProgress) {
        return
      }
      priceToBuy = Number(priceToBuy)
      const balance = this.activeAccountBalance - this.balanceMinimum // Subtract this dollar amount so that there is room for rounding errors
      const amountToSpend = balance - (balance * this.highestFee)
      let orderSize

      if (this.productInfo.baseIncrementRoundValue === 0) {
        orderSize = Math.trunc(amountToSpend / priceToBuy)
      } else {
        orderSize = Number((amountToSpend / priceToBuy).toFixed(this.productInfo.baseIncrementRoundValue))
      }

      const orderParams = {
        side: 'buy',
        price: priceToBuy,
        size: orderSize,
        // eslint-disable-next-line camelcase
        product_id: this.strategy.coin,
        // eslint-disable-next-line camelcase
        time_in_force: 'FOK'
      }

      if (this.sim) {
        this.emit('order', { order: { ...orderParams, time: ticker.time }, positionInfo: this.positionInfo })
        this.orders.push({ ...orderParams, time: ticker.time })
        this.positionInfo.positionExists = true
        this.positionInfo.positionAcquiredPrice = priceToBuy
        this.positionInfo.positionAcquiredCost = priceToBuy * orderSize + this.highestFee
        this.activeAccountBalance = orderSize
        return
      }

      // Place buy order
      this._createClient()
      const order = await this.authedClient.placeOrder(orderParams)

      // Loop to wait for order to be filled:
      StrategyLog.logAction('info', 'Checking buy order result...', this.strategy.id)
      for (let i = 0; i < 10 && this.positionInfo.positionExists === false; ++i) {
        let orderDetails
        await sails.helpers.util.sleep(6000) // wait 6 seconds
        try {
          orderDetails = await this.authedClient.getOrder(order.id) // Get latest order details
        } catch (err) {
          const message = 'Error occured when attempting to get the order.'
          const errorMsg = new Error(err)
          await StrategyLog.logAction('error', message, this.strategy.id)
          await StrategyLog.logAction('error', errorMsg.body, this.strategy.id)
          continue
        }
        sails.log.debug(orderDetails)

        if (orderDetails.status === 'done') {
          if (orderDetails.done_reason !== 'filled') {
            await StrategyLog.logAction('error', 'Buy order did not complete due to being filled? done_reason: ' + orderDetails.done_reason, this.strategy.id)
            throw new Error('Buy order did not complete due to being filled? done_reason: ' + orderDetails.done_reason)
          } else {
            // Update position info
            this.positionInfo.positionExists = true
            this.positionInfo.positionAcquiredPrice = parseFloat(orderDetails.executed_value) / parseFloat(orderDetails.filled_size)
            this.positionInfo.positionAcquiredCost = parseFloat(orderDetails.executed_value) + parseFloat(orderDetails.fill_fees)

            // Update positionData file:
            await sails.models.strategy.updateOne({ id: this.strategy.id }).set({ positionInfo: this.positionInfo })

            await StrategyLog.logAction(
              'buy',
              `Successfully purchased ${orderSize} ${this.productInfo.base_currency} for ${priceToBuy}`,
              this.strategy.id
            )
            await Trades.addTrade(this.strategy.id, 'buy', this.productInfo.base_currency, orderSize)
          }
        }
      }

      // Check if order wasn't filled and needs cancelled
      if (this.positionInfo.positionExists === false) {
        const cancelOrder = await this.authedClient.cancelOrder(order.id)
        if (cancelOrder !== order.id) {
          throw new Error('Attempted to cancel failed order but it did not work. cancelOrderReturn: ' + cancelOrder + 'orderID: ' + order.id)
        }
      }
    } catch (err) {
      const message = 'Error occurred in buyPosition method.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
    }
  }

  /**
   * Retrieves the current maker and taker fees and returns the highest one as a number
   *
   * @return {number} highestFee The highest fee between the taker and maker fee
   */
  async returnHighestFee () {
    try {
      const feeResult = await this.coinbaseLibObject.getFees()

      const makerFee = parseFloat(feeResult.maker_fee_rate)
      const takerFee = parseFloat(feeResult.taker_fee_rate)

      if (makerFee > takerFee) {
        return makerFee
      } else {
        return takerFee
      }
    } catch (err) {
      const message = 'Error occurred in getFees method.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
      throw err
    }
  }

  /**
   * Stub for the function called by classes extending this
   * @return {Promise<void>}
   */
  async analyze (tick) {
    if (!this.que) { return }
    if (this.first) {
      this.first = true
      sails.log.info(`Starting price of ${this.strategy.coin} for strategy_id ${this.strategy.id} is: ${tick.price}`)
    }
    this.tradeHistory.push(tick)
    if (!this.sim) {
      this.highestFee = await this.returnHighestFee()
      await this.getCurrencyBalance()
    }
  };

  async getCurrencyBalance () {
    if (this.positionInfo.positionExists) {
      const baseCurrencyAccount = await this.authedClient.getAccount(this.accountIDs.baseCurrencyAccountID) // Grab account information to view balance
      if (baseCurrencyAccount.available <= 0) {
        throw new Error(`Error, there is no ${this.productInfo.baseCurrency} balance available for use. Terminating program.`)
      }
      this.activeAccountBalance = baseCurrencyAccount.available
      return
    }

    const quoteCurrencyAccount = await this.authedClient.getAccount(this.accountIDs.quoteCurrencyAccountID) // Grab account information to view balance
    const availableBalance = parseFloat(quoteCurrencyAccount.available)
    if (availableBalance <= 0) {
      throw new Error(`Error, there is no ${this.productInfo.quoteCurrency} balance available for use. Terminating program.`)
    }
    this.activeAccountBalance = quoteCurrencyAccount.available
  }

  /**********************************
   *      GENETIC ALGO CODE         *
   **********************************/

  /**
   * Return random number
   *
   * @param min
   * @param max
   * @return {number}
   */
  getRandomNumber (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Returns a random boolean
   *
   * @return {boolean}
   */
  shouldChange () {
    return Math.random() < 0.5
  }
}
module.exports = Trader
