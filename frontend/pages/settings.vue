<template>
  <v-container>
    <v-card>
      <v-card-title>User Settings</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="editedUser.firstName" label="First Name" :rules="rules.required" />
          <v-text-field v-model="editedUser.lastName" label="Last Name" :rules="rules.required" />
          <v-text-field v-model="editedUser.coinBaseApiKey" label="Coin Base Api Key" :rules="rules.required" />
          <v-text-field v-model="editedUser.coinBaseApiPhrase" label="Coin Base Api Phrase" :rules="rules.required" />
          <v-text-field v-model="editedUser.coinBaseApiSecret" label="Coin Base Api Secret" :rules="rules.required" />
          <v-text-field v-model="editedUser.paperCoinBaseApiKey" label="Paper Coin Base Api Key" />
          <v-text-field v-model="editedUser.paperCoinBaseApiPhrase" label="Paper Coin Base Api Phrase" />
          <v-text-field v-model="editedUser.paperCoinBaseApiSecret" label="Paper Coin Base Api Secret" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="loading" @click="editUser">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import cloneDeep from 'lodash.clonedeep'
import validations from '~/mixins/validations'
export default {
  name: 'Settings',
  mixins: [validations],
  data () {
    return {
      editedUser: {},
      loading: false
    }
  },
  created () {
    this.editedUser = cloneDeep(this.user)
  },
  methods: {
    async editUser () {
      if (!this.$refs.form.validate()) { return }
      this.loading = true
      const { data: { user, message, problems }, status } = await this.$axios.patch('/v1/user/edit', {
        ...this.editedUser
      }).catch(e => e)
      this.loading = false
      if (this.$error(status, message, problems)) { return }
      this.$auth.setUser(user)
      this.$noty.success('User settings updated')
    }
  }
}
</script>

<style scoped>

</style>
