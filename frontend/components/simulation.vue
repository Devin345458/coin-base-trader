<template>
  <v-dialog v-model="internal_value" persistent max-width="500" :fullscreen="!!results">
    <v-card ref="card" :loading="loading">
      <v-card-title>
        Simulation Settings
        <v-spacer />
        <template v-if="results">
          P&L {{ totalPNL }}
        </template>
        <v-icon @click="internal_value = false">
          mdi-close
        </v-icon>
      </v-card-title>
      <v-card-text v-if="!results">
        <v-form ref="simulation">
          <v-text-field v-model="number_of_days" type="number" label="Number of days to run sim" />
          <v-currency-field v-model="initial_balance" prefix="$" label="Initial Balance" />
        </v-form>
      </v-card-text>
      <v-card-text v-else>
        <trading-chart :ticks="results.candles" :trades="results.trades" :indicators="results.indicators" :width="cardWidth" :coin="strategy.coin" />
        <v-data-table
          :items="sorted_trades"
          :headers="headers"
        >
          <template v-slot:item.time="{item}">
            {{ time(item.time) }}
          </template>
          <template v-slot:item.size="{item}">
            {{ Number(item.size).toFixed(2) }}
          </template>
          <template v-slot:item.profitLoss="{item}">
            {{ item.profitLoss? '$' + item.profitLoss.toFixed(2): '' }}
          </template>
          <template v-slot:item.side="{item: {side}}">
            <div style="border-left: 2px solid; padding-left: 5px" :style="{ color: side === 'buy'? 'green': 'red', borderColor: side === 'buy'? 'green': 'red'}">
              {{ side.charAt(0).toUpperCase() + side.slice(1) }}
            </div>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="results" color="error" @click="internal_value = false">
          Close
        </v-btn>
        <v-spacer />
        <v-btn v-if="!results" color="primary" @click="runSim">
          Run Sim
        </v-btn>
        <v-btn v-else color="primary" @click="results = false">
          Edit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment'
import TradingChart from '~/components/charts/TradingChart'
export default {
  name: 'Simulation',
  components: { TradingChart },
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
      initial_balance: 0,
      number_of_days: 0,
      results: false,
      headers: [
        { text: 'Side', value: 'side' },
        { text: 'Market', value: 'product_id' },
        { text: 'Time', value: 'time' },
        { text: 'Size', value: 'size' },
        { text: 'Price', value: 'price' },
        { text: 'P&L', value: 'profitLoss' }
      ],
      chartData: [],
      chart: null,
      cardWidth: 500
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
    },
    totalPNL () {
      if (!this.results) { return 0 }
      return this.results.trades.filter(a => a.profitLoss).map(a => a.profitLoss).reduce((a, b) => a + b, 0).toFixed(2)
    },
    sorted_trades () {
      const data = [...this.results.trades]
      return data.sort((a, b) => a.time - b.time)
    }
  },
  watch: {
    internal_value (val) {
      if (!val) {
        this.results = false
      }
    },
    results () {
      this.$nextTick(() => {
        this.onResize()
      })
    }
  },
  methods: {
    onResize () {
      this.cardWidth = this.$refs.card.$el.offsetWidth
    },
    async runSim () {
      if (!this.$refs.simulation.validate()) { return }
      this.loading = true
      const { data: { results, message, errors }, status } = await this.$axios.post('/v1/strategy/run-sim', {
        initialBalance: this.initial_balance,
        numberOfDays: this.number_of_days,
        strategy: this.strategy
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, errors)) { }
      this.results = results
    },
    time (val) {
      return moment(val * 1000).format('MMMM Do YYYY, h:mm:ss a')
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
