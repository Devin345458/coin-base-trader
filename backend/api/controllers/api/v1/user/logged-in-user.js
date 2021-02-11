module.exports = {

  friendlyName: 'Logged in user',

  description: '',

  inputs: {

  },

  exits: {

  },

  fn () {
    // All done.
    return {
      user: this.req.user
    }
  }

}
