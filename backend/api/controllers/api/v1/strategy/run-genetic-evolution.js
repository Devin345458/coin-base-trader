const GeneticAlgorithm = require('../../../../classes/geneticAlgorithm')
const { createAndInitializeClass } = require('../../../../classes/strategies/indicatorFinder')

module.exports = {

  friendlyName: 'Run Genetic Evolution',

  description: 'Runs a genetic evolution of the trading strategy and returns the best settings and result',

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
    },
    iterations: {
      type: 'number'
    },
    populationSize: {
      type: 'number'
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

  async fn ({ initialBalance, numberOfDays, strategy, iterations, populationSize }, exits) {
    if (!iterations) { iterations = 10 }
    if (!populationSize) { populationSize = 10 }
    strategy.user = this.req.user
    const candles = await sails.helpers.getPriceHistory(numberOfDays, strategy.coin, this.req.user)
    sails.cache.set('candles', candles)
    const tradingStrategy = await createAndInitializeClass(strategy, true)

    const fitnessFunction = async (options) => {
      strategy.options = options
      const tradingStrategy = await createAndInitializeClass(strategy, true)
      await tradingStrategy.setSim(initialBalance, 0.0018)

      const candles = sails.cache.get('candles')
      for (let i = 0; i < candles.length; i++) {
        await tradingStrategy.analyze({
          coin: strategy.coin,
          price: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      const score = tradingStrategy.orders.filter(a => a.profitLoss).reduce((total, a) => total + a.profitLoss, 0)
      if (score < options.score) {
        console.log(score, options.score)
      }
      options.score = score
      return score
    }

    const config = {
      mutationFunction: tradingStrategy.mutation.bind(tradingStrategy),
      crossoverFunction: tradingStrategy.crossover.bind(tradingStrategy),
      async doesABeatBFunction (phenoTypeA, phenoTypeB) {
        const aScore = await fitnessFunction(phenoTypeA)
        const bScore = await fitnessFunction(phenoTypeB)
        return aScore >= bScore
      },
      fitnessFunction,
      population: [strategy.options],
      populationSize: iterations
    }

    const results = []
    const ga = new GeneticAlgorithm(config)
    for (let loop = 1; loop <= iterations; loop++) {
      await ga.evolve()
      results.push({ iteration: loop, best_value: ga.bestScore() })
    }

    return exits.success({ iterations: results, bestOptions: ga.best() })
  }

}
