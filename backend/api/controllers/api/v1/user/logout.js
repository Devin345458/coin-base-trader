module.exports = {

  friendlyName: 'Logout',

  description: 'Logout the currently loggeed in user',

  inputs: {

  },

  exits: {

  },

  async fn (inputs) {
    // All done.
    this.req.logout()
    this.res.ok()
  }

}
