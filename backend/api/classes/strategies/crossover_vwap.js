const Trader = require('./../trader')
const { ema, vwma2 } = require('./analysisTools')
module.exports = class CrossoverVwap extends Trader {
  static options = [
    {
      property: 'vWapLength',
      label: 'VWAP Length',
      type: 'number',
      default: 10,
      required: true
    },
    {
      property: 'vWapMax',
      label: 'Max VWAP Length ',
      type: 'number',
      default: 8000,
      required: true
    },
    {
      property: 'emaLen',
      label: 'EMA search length',
      type: 'number',
      default: 30,
      required: true
    },
    {
      property: 'vwmaOffset',
      label: 'How far above the VWMA does the price have to be to make a purchase',
      type: 'number',
      default: 30,
      required: true
    },
    {
      property: 'emaOffset',
      label: 'How far above the EMA does the VWMA have to be to sell',
      type: 'number',
      default: 30,
      required: true
    }
  ]

  // Settings for VWAP
  vwapMultiplier = 0
  vwapDivider = 0
  vwapCount = 0

  // Settings for EMA
  prevEma = 0

  // Settings for VMA
  prevVMA = undefined

  async analyze (tick) {
    await super.analyze(tick)
    const vMapGold = vwma2(this.tradeHistory, this.strategy.vWapLength) // gold
    const emaGreen = ema(this.tradeHistory, this.strategy.emaLen) // green

    this.emit('indicators', { time: tick.time * 1000, name: 'VMA', indicator: vMapGold, color: '#ffde5a' })
    // this.emit('indicators', { time: tick.time * 1000, name: 'EMA', indicator: emaGreen, color: '#0c5af7' })

    // If we have all our stats then
    if (!vMapGold || !emaGreen) {
      return
    }
    if (!this.positionInfo.positionExists && (tick.price - this.strategy.vwmaOffset) > vMapGold) {
      this.buyPosition(tick.price, tick)
    }

    if (this.positionInfo.positionExists && (tick.price + this.strategy.emaOffset) < vMapGold) {
      this.sellPosition(tick.price, tick)
    }
  }

  mutation (options) {
    if (this.shouldChange()) {
      options.vWapLength += this.getRandomNumber(-8, 8)
      if (options.vWapLength <= 0) {
        options.vWapLength = 1
      }
    }

    if (this.shouldChange()) {
      options.vWapMax += this.getRandomNumber(-20, 20)
      if (options.vWapMax <= 50) {
        options.vWapMax = 50
      }
    }

    if (this.shouldChange()) {
      options.emaLen += this.getRandomNumber(-10, 10)
      if (options.emaLen <= 10) {
        options.emaLen = 10
      }
    }

    if (this.shouldChange()) {
      options.vwmaOffset += this.getRandomNumber(-30, 30)
    }

    if (this.shouldChange()) {
      options.bailOutPoint += this.getRandomNumber(-30, 30)
    }

    if (this.shouldChange()) {
      options.emaOffset += this.getRandomNumber(-30, 30)
    }

    return options
  }

  crossover (optionsA, optionsB) {
    if (this.shouldChange()) {
      const newChromosome = JSON.parse(JSON.stringify(optionsA))
      Object.keys(optionsA).forEach((key) => {
        if (key === 'score') { return }
        newChromosome[key] = this.shouldChange() ? optionsA[key] : optionsB[key]
      })

      return newChromosome
    }

    /**
     * If No chance for crossover. Return one of the parent Chromosome */
    return (Math.random() < 0.5) ? optionsA : optionsB
  }
}
