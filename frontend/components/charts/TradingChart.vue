<template>
  <trading-vue
    v-if="trading"
    ref="tradingVue"
    toolbar
    :overlays="overlays"
    :data="trading"
    :width="width"
    :title-txt="coin"
  />
</template>

<script>
import Overlays from 'tvjs-overlays'
export default {
  name: 'TradingChart',
  props: {
    coin: {
      type: String,
      required: true
    },
    ticks: {
      type: Array,
      default: () => []
    },
    trades: {
      type: Array,
      default: () => []
    },
    indicators: {
      type: Object,
      default: () => {}
    },
    width: {
      type: Number,
      default: 800
    }
  },
  data () {
    return {
      trading: false,
      overlays: [Overlays.VWMA, Overlays.EMA]
    }
  },
  computed: {
    chartTicks () {
      const data = [...this.ticks]
      return data.sort((a, b) => a.time - b.time).map((d) => {
        return [d.time * 1000, d.close, d.high, d.low, d.close, Number(d.volume.toFixed(2))]
      })
    },
    chartVolume () {
      const data = [...this.ticks]
      return data.sort((a, b) => b.time - a.time).map((d) => {
        return [d.time * 1000, Number(d.volume.toFixed(2))]
      })
    },
    chartTrades () {
      const data = [...this.trades]
      return data.sort((a, b) => a.time - b.time).map((d) => {
        return [d.time * 1000, d.side === 'buy' ? 1 : 0, Number(d.price), this.tradeLabel(d)]
      })
    }
  },
  errorCaptured () {
    return false // stops the error from propagating further
  },
  watch: {
    chartTicks: {
      handler () {
        const data = {
          chart: {
            type: 'Spline',
            data: this.chartTicks
          },
          onchart: [
            {
              name: 'Trades',
              type: 'Trades',
              data: this.chartTrades,
              settings: {
                legend: false,
                'z-index': 5
              }
            }
          ],
          offchart: [
            {
              name: 'Volume',
              type: 'Volume',
              data: this.chartVolume
            }
          ]
        }
        if (this.indicators) {
          Object.keys(this.indicators).forEach((key) => {
            const tmp = this.indicators[key].filter(a => a.indicator).sort((a, b) => a.time - b.time)
            data.onchart.push({
              name: key,
              type: 'Spline',
              data: tmp.map(a => [a.time, a.indicator]),
              settings: {
                skipNaN: true
              }
            })
          })
        }
        this.trading = new this.$DataCube(data)
      },
      immediate: true
    }
  },
  methods: {
    tradeLabel (trade) {
      switch (trade.side) {
        case 'buy':
          return `Purchased ${Number(trade.size).toFixed(2)} shares at $${trade.price}`
        case 'sell':
          return `Sold ${Number(trade.size).toFixed(2)} shares at $${trade.price}`
      }
    }
  }
}
</script>

<style scoped>

</style>
