<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      color="#121D27"
      app
    >
      <v-list>
        <v-list-item>
          <v-list-item-content class="logoText">
            Coin Base Trader
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="logout">
          <v-list-item-action>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      fixed
      app
      color="#060D13"
    >
      <v-toolbar-title v-text="title" />
      <v-spacer />
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>
    <v-footer app color="#060D13">
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'Default',
  data () {
    return {
      drawer: true,
      items: [
        {
          icon: 'mdi-desktop-mac-dashboard',
          title: 'Dashboard',
          to: '/dashboard'
        },
        {
          icon: 'mdi-cog-outline',
          title: 'Settings',
          to: '/settings'
        },
        {
          icon: 'mdi-strategy',
          title: 'Strategies',
          to: '/strategies'
        }
      ],
      title: 'Coin Base Trader'
    }
  },
  watch: {
    $route: {
      handler (val) {
        if (process.client) {
          this.title = this.$route.name.charAt(0).toUpperCase() + this.$route.name.slice(1)
        }
      },
      immediate: true
    }
  },
  methods: {
    async logout () {
      await this.$auth.logout()
      await this.$router.push('/')
    }
  }
}
</script>

<style>
  .logoText {
    color: #1552F0;
    font-size: 18px;
    font-weight: bold;
  }
</style>
