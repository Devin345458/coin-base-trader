class GeneticAlgorithmConstructor {
  settings = {
    mutationFunction (phenotype) { return phenotype },
    crossoverFunction: function crossoverFunction (a, b) { return a },
    fitnessFunction: undefined,
    doesABeatBFunction: undefined,
    population: [],
    populationSize: 100
  }

  nextGeneration = []

  constructor (options) {
    if (!options.fitnessFunction) {
      throw new Error('Missing Fitness Function')
    }

    if (!options.doesABeatBFunction) {
      throw new Error('Missing Does A Beat B Function')
    }

    Object.assign(this.settings, options)

    if (this.settings.population.length <= 0) { throw new Error('population must be an array and contain at least 1 phenotypes') }
    if (this.settings.populationSize <= 0) { throw new Error('populationSize must be greater than 0') }
  }

  _populate () {
    const size = this.settings.population.length
    while (this.settings.population.length < this.settings.populationSize) {
      this.settings.population.push(
        this._mutate(this.cloneJSON(this.settings.population[Math.floor(Math.random() * size)]))
      )
    }
  }

  cloneJSON (object) {
    return JSON.parse(JSON.stringify(object))
  }

  _mutate (phenotype) {
    phenotype = this.cloneJSON(phenotype)
    return this.settings.mutationFunction(phenotype)
  }

  _crossover (phenotype) {
    phenotype = this.cloneJSON(phenotype)
    let mate = this.settings.population[Math.floor(Math.random() * this.settings.population.length)]
    mate = this.cloneJSON(mate)
    return this.settings.crossoverFunction(phenotype, mate)
  }

  _doesABeatB (a, b) {
    if (this.settings.doesABeatBFunction) {
      return this.settings.doesABeatBFunction(a, b)
    } else {
      return this.settings.fitnessFunction(a) >= this.settings.fitnessFunction(b)
    }
  }

  async _competition (phenotype, competitor) {
  }

  async _compete () {
    const nextGeneration = []
    for (let p = 0; p < this.settings.population.length - 1; p += 2) {
      const phenotype = this.settings.population[p]
      const competitor = this.settings.population[p + 1]

      nextGeneration.push(phenotype)

      if (await this._doesABeatB(phenotype, competitor)) {
        if (Math.random() < 0.5) {
          nextGeneration.push(this._mutate(phenotype))
        } else {
          nextGeneration.push(this._crossover(phenotype))
        }
      } else {
        nextGeneration.push(competitor)
      }
    }

    this.settings.population = nextGeneration
  }

  _randomizePopulationOrder () {
    for (let index = 0; index < this.settings.population.length; index++) {
      const otherIndex = Math.floor(Math.random() * this.settings.population.length)
      const temp = this.settings.population[otherIndex]
      this.settings.population[otherIndex] = this.settings.population[index]
      this.settings.population[index] = temp
    }
  }

  async evolve () {
    this._populate()
    this._randomizePopulationOrder()
    await this._compete()
    return this
  }

  best () {
    const result = this.settings.population.reduce(function (a, b) {
      return a.score >= b.score ? a : b
    }, this.settings.population[0])
    return this.cloneJSON(result)
  }

  bestScore () {
    return this.best().score
  }
}

module.exports = GeneticAlgorithmConstructor
