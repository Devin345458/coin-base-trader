<template>
  <v-container>
    <strategy-form ref="form" v-model="loading" :strategy="strategy" @save="save" />
  </v-container>
</template>

<script>
import StrategyForm from '~/components/strategy/form'
export default {
  name: 'Add',
  components: { StrategyForm },
  data () {
    return {
      loading: false,
      strategy: {
        name: null,
        indicator: null,
        type: null,
        coin: null,
        options: {}
      }
    }
  },
  methods: {
    async save () {
      if (!this.$refs.form.validate()) { return }
      this.loading = true
      const { data: { strategyId, message, problems }, status } = await this.$axios.post('/v1/strategy/add', {
        ...this.strategy
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, problems)) { return }
      await this.$router.push('/strategies/view/' + strategyId)
    }
  }

}
</script>

<style scoped>

</style>
