module.exports = {

  friendlyName: 'Add',

  description: 'Add strategy.',

  inputs: {
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'The strategy model was successfully subscribed to'
    },
    error: {
      responseType: 'serverError',
      description: 'It didn\'t save'
    }
  },

  fn (inputs, exits) {
    sails.sockets.join(this.req, 'strategy', (err) => {
      if (err) {
        return exits.error()
      }

      return exits.success({
        message: 'successfully subscribed'
      })
    })
  }

}
