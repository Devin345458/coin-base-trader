<template>
  <v-container>
    <v-card-title>{{ strategy.name }} - {{ strategy.coin }}</v-card-title>
    <v-row>
      <v-col cols="12">
        <v-card :loading="tradesLoading">
          <v-card-title>
            Trades
            <v-spacer />
            Total PNL: ${{ totalPNL }}
          </v-card-title>
          <v-card-text>
            <v-data-table
              :items="trades"
              :headers="headers"
            >
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
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card :loading="logLoading">
          <v-card-title>
            Log
            <v-spacer />
            <v-switch v-model="autoScroll" label="Auto Scroll" />
          </v-card-title>
          <v-card-text ref="logTerminal" class="black" style="overflow: scroll; max-height: 300px">
            <p v-for="log in logs" :key="log.id" class="white--text">
              [{{ log.createdAt }}] {{ log.text }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Index',
  data () {
    return {
      headers: [
        { text: 'Side', value: 'side' },
        { text: 'Market', value: 'currency' },
        { text: 'Size', value: 'quantity' },
        { text: 'P&L', value: 'profitLoss' }
      ],
      strategy: {
      },
      trades: [],
      loading: true,
      logs: [],
      autoScroll: true,
      tradesLoading: false,
      logLoading: false
    }
  },
  computed: {
    totalPNL () {
      return this.trades.reduce((accumulator, currentValue) => accumulator + currentValue.profitLoss, 0).toFixed(2)
    }
  },
  destroyed () {
    this.$sails.socket.off('newLog')
    this.$sails.socket.off('trade')
  },
  mounted () {
    this.getStrategy()
    this.getLogs()
    this.getTrades()
  },
  methods: {
    async getStrategy () {
      this.loading = true
      const { data: { strategy, message, errors }, status } = await this.$axios.get('/v1/strategy/view', {
        params: {
          id: this.$route.params.id
        }
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, errors)) { return }
      this.strategy = strategy
    },
    getLogs () {
      this.logLoading = true
      this.$sails.socket.get(
        '/api/v1/strategy-log/get-log?strategyId=' + this.$route.params.id,
        {
          headers: {
            Authorization: this.$auth.strategy.token.$storage._state['_token.local']
          }
        },
        ({ logs }) => {
          this.logLoading = false
          this.logs = logs
          this.$nextTick(() => {
            if (this.autoScroll) { this.$refs.logTerminal.scrollTop = this.$refs.logTerminal.scrollHeight }
          })
        }
      )
      this.$sails.socket.on('newLog', ({ data }) => {
        this.logs.push(data)
        this.$nextTick(() => {
          if (this.autoScroll) { this.$refs.logTerminal.scrollTop = this.$refs.logTerminal.scrollHeight }
        })
      })
    },
    getTrades () {
      this.tradesLoading = true
      this.$sails.socket.get(
        '/api/v1/trade/get-trade?strategyId=' + this.$route.params.id,
        {
          headers: {
            Authorization: this.$auth.strategy.token.$storage._state['_token.local']
          }
        },
        ({ trades }) => {
          this.tradesLoading = false
          this.trades = trades
        }
      )
      this.$sails.socket.on('trade', ({ data }) => {
        this.trades.push(data)
      })
    }
  }
}
</script>

<style scoped>

</style>
