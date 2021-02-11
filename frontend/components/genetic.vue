<template>
  <v-dialog v-model="internal_value" persistent width="80%">
    <v-card ref="card" :loading="loading">
      <v-card-title>
        Genetic Training Settings
        <v-spacer />
        <v-icon @click="internal_value = false">
          mdi-close
        </v-icon>
      </v-card-title>
      <v-card-text v-if="!results">
        <v-form ref="simulation">
          <v-text-field v-model="number_of_days" type="number" label="Number of days to run sim" />
          <v-currency-field v-model="initial_balance" prefix="$" label="Initial Balance" />
          <v-text-field v-model="iterations" type="number" label="Number of iterations" />
          <v-text-field v-model="populationSize" type="number" label="Population Size" />
        </v-form>
      </v-card-text>
      <v-card-text v-else>
        <v-data-table
          :items="results"
          :headers="headers"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="results" color="error" @click="internal_value = false">
          Close
        </v-btn>
        <v-spacer />
        <v-btn v-if="!results" color="primary" @click="runGeneticEvolution">
          Run Genetic Evolution
        </v-btn>
        <v-btn v-if="results" color="primary" @click="$emit('setOptions', bestOptions)">
          Set Options From Best Run
        </v-btn>
        <v-btn v-if="results" color="primary" @click="results = false">
          Edit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'Genetic',
  props: {
    value: {
      type: Boolean,
      required: true
    },
    strategy: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      loading: false,
      initial_balance: 10000,
      number_of_days: 1,
      iterations: 10,
      populationSize: 10,
      results: false,
      headers: [
        { text: 'Iteration', value: 'iteration' },
        { text: 'Best Value', value: 'best_value' }
      ],
      bestOptions: {}
    }
  },
  computed: {
    internal_value: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    async runGeneticEvolution () {
      if (!this.$refs.simulation.validate()) { return }
      this.loading = true
      const { data: { iterations, bestOptions, message, errors }, status } = await this.$axios.post('/v1/strategy/run-genetic-evolution', {
        initialBalance: this.initial_balance,
        numberOfDays: this.number_of_days,
        iterations: this.iterations,
        populationSize: this.populationSize,
        strategy: this.strategy
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, errors)) { }
      this.results = iterations
      this.bestOptions = bestOptions
    }
  }
}
</script>

<style lang="scss">
#sim-chart {
  path {
    &.area {
      fill: url(#area-gradient);
      fill-opacity: 1;
    }

    &.line {
      stroke: rgb(26, 154, 249);
      stroke-width: 1.5px;
    }
  }

  .bottom-axis {
    height: 20px !important;
  }

  .y-axis, .x-axis {
    .tick path {
      stroke: #bbb;
    }

    .tick text {
      fill: white;
    }

    .domain {
      display: none;
    }
  }

  .y-axis {
    width: 50px;
    border-left: 1px solid #bbb;
  }

  .volume {
    opacity: 0.2;
  }

  .border {
    border: 1px solid #bbb;
    grid-column: 3 / 5;
    grid-row: 3;
  }
}

</style>
