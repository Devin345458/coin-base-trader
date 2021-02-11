const Trader = require('./../trader')

module.exports = class Momentum extends Trader {
  static options = [
    {
      property: 'trailingBuyPrice',
      label: 'Trailing Buy Price',
      type: 'Currency',
      required: true
    },
    {
      property: 'trailingSellPrice',
      label: 'Trailing Sell Price',
      type: 'Currency',
      required: true
    },
    {
      property: 'bailOutPoint',
      label: 'How far to let drop before selling',
      type: 'Currency',
      required: true
    }
  ]

  lastPeakPrice
  lastValleyPrice

  async analyze (ticker) {
    await super.analyze(ticker)
    if (!this.lastPeakPrice || !this.lastValleyPrice) {
      this.lastPeakPrice = ticker.price
      this.lastValleyPrice = ticker.price
    }
    if (this.positionInfo.positionExists) {
      this.losePosition(ticker)
    } else {
      this.gainPosition(ticker)
    }
  }

  /**
   * Check and see if we have met our sale conditions if so try and sell the coin
   *
   * @param {Object} ticker
   */
  losePosition (ticker) {
    if (this.lastPeakPrice < ticker.price) {
      // New peak hit, reset values
      this.lastPeakPrice = ticker.price
      this.lastValleyPrice = ticker.price
    } else if (this.lastValleyPrice > ticker.price) {
      // New valley hit, track valley and check sell conditions
      this.lastValleyPrice = ticker.price

      // Profit if we were to sell now
      const receivedValue = (this.lastValleyPrice * this.activeAccountBalance) - ((this.lastValleyPrice * this.activeAccountBalance) * this.highestFee)

      // Highest price we can sell at
      const target = this.lastPeakPrice - this.strategy.trailingSellPrice

      // Check if the dip is greater than our allowed sale dip and we are profitable
      const optimalSellPosition = target >= this.lastValleyPrice && receivedValue > this.positionInfo.positionAcquiredCost

      // Check if our bailout condition has been met
      const bailOutPosition = this.positionInfo.positionAcquiredCost - receivedValue >= this.strategy.bailOutPoint

      sails.log.debug(`Sell Position, LVP: ${this.lastValleyPrice} needs to be less than or equal to ${target} to sell  and the receivedValue: ${receivedValue} needs to be greater than the positionAcquiredCost: ${this.positionInfo.positionAcquiredCost}`)

      // Should we sell
      if (optimalSellPosition || bailOutPosition) {
        sails.log.info('Attempting to sell position...')
        const priceToSell = Number(ticker.price.toFixed(this.productInfo.quoteIncrementRoundValue))
        return this.sellPosition(priceToSell, ticker)
      }
    }
  }

  /**
   * Loops forever until the conditions are right to attempt to buy a position. Every loop sleeps to let the currentPrice update
   * then updates the lastPeak/lastValley price as appropriate, if the price hits a new peak price it will check if the conditions are
   * met to buy the position and call the method if appropriate.
   *
   * @param {Object} ticker
   */
  gainPosition (ticker) {
    if (this.lastPeakPrice < ticker.price) {
      // New peak hit, track peak price and check buy conditions
      this.lastPeakPrice = ticker.price

      const target = this.lastValleyPrice + this.strategy.trailingBuyPrice

      StrategyLog.logAction('info', `Buy Position, Last Peak Price: ${this.lastPeakPrice} needs to be greater than or equal to ${target} to buy`, this.strategy.id)

      if (this.lastPeakPrice >= target) {
        StrategyLog.logAction('info', 'Attempting to buy position...', this.strategy.id)

        // Create a new authenticated client to prevent it from expiring or hitting API limits
        const priceToBuy = Number(ticker.price.toFixed(this.productInfo.quoteIncrementRoundValue))
        this.buyPosition(priceToBuy, ticker)
      }
    } else if (this.lastValleyPrice > ticker.price) {
      // New valley hit, reset values

      this.lastPeakPrice = ticker.price
      this.lastValleyPrice = ticker.price

      StrategyLog.logAction('info', `Buy Position, Last Valley Price: ${this.lastValleyPrice}`, this.strategy.id)
    }
  }
}
