<template>
  <v-card :loading="loading">
    <v-card-title>Edit {{ strategy.name }} Strategy</v-card-title>
    <v-card-text>
      <v-form ref="form">
        <v-select v-model="strategy.type" :items="types" label="Trade Type" :rules="rules.required" @change="loadCoins" />
        <v-text-field v-model="strategy.name" label="Strategy Name" :rules="rules.required" />
        <v-text-field v-model="interval" type="number" label="Strategy Interval ( Minutes )" :rules="rules.required" />
        <v-select v-model="strategy.indicator" :items="indicators" label="Indicator" :rules="rules.required" @change="getOptions" />
        <v-select
          v-if="!edit"
          v-model="strategy.coin"
          item-value="id"
          item-text="id"
          :items="coins"
          :loading="coinsLoading"
          label="Coin"
          :rules="rules.required"
        />
        <template v-for="option in options">
          <v-currency-field
            v-if="option.type === 'Currency'"
            :key="option.property"
            v-model="strategy.options[option.property]"
            prefix="$"
            :label="option.label"
            :rules="option.required? rules.required: []"
          />
          <v-text-field
            v-else-if="option.type === 'email'"
            :key="option.property"
            v-model="strategy.options[option.property]"
            :label="option.label"
            :rules="option.required? requireRule('email'): rules.email"
          />
          <v-text-field
            v-else-if="option.type === 'number'"
            :key="option.property"
            v-model.number="strategy.options[option.property]"
            type="number"
            :label="option.label"
            :rules="option.required? rules.required: []"
          />
          <v-text-field
            v-else
            :key="option.property"
            v-model="strategy.options[option.property]"
            :type="option.type"
            :label="option.label"
            :rules="option.required? rules.required: []"
          />
        </template>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn v-if="edit" color="accent" @click="$emit('simulate')">
        Run Simulation
      </v-btn>
      <v-btn v-if="edit" color="accent" @click="$emit('genetic')">
        Run Genetic Evolution
      </v-btn>
      <v-spacer />
      <v-btn color="primary" :loading="loading" @click="$emit('save')">
        <v-icon v-if="!edit">
          mdi-plus
        </v-icon>
        {{ edit? 'Save': 'Add' }} Strategy
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import validations from '~/mixins/validations'
export default {
  name: 'StrategyForm',
  mixins: [validations],
  props: {
    strategy: {
      type: Object,
      required: true
    },
    value: {
      type: Boolean,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      coinsLoading: false,
      indicators: [
        { text: 'Moving Average', value: 'MA' },
        { text: 'Cross Over Volume Mass', value: 'Vmap' }
      ],
      types: [
        { text: 'Development - Paper Trading', value: 'Paper' },
        { text: 'Live - Production', value: 'Live' }
      ],
      options: [],
      coins: []
    }
  },
  computed: {
    loading: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    interval: {
      get () {
        return this.strategy.interval / 1000 / 60 || null
      },
      set (val) {
        this.strategy.interval = val * 1000 * 60
      }
    }
  },
  watch: {
    'strategy.indicator' () {
      this.getOptions()
    }
  },
  mounted () {
    this.getOptions()
    this.loadCoins()
  },
  methods: {
    async loadCoins () {
      const paper = this.strategy.type === 'Paper'
      this.coinsLoading = true
      const { data: { coins, message }, status } = await this.$axios.get(`/v1/coinbase/coins?paper=${paper}`).catch(e => e)
      this.coinsLoading = false
      if (this.$error(status, message)) { return }
      this.coins = coins
    },
    async getOptions () {
      if (!this.strategy.indicator) { return }
      this.loading = true
      const { data: { options, message, errors }, status } = await this.$axios.get('/v1/strategy/options', {
        params: {
          indicator: this.strategy.indicator
        }
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, errors)) { return }
      this.options = options
    },
    validate () {
      return this.$refs.form.validate()
    }
  }
}
</script>

<style scoped>

</style>
