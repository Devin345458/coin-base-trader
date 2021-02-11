module.exports = {

  friendlyName: 'Index Strategy -> List of all strategies',

  description: 'Get all strategies for the logged in user.',

  inputs: {
  },

  exits: {
    success: {
      responseType: 'ok'
    }
  },

  async fn () {
    const strategies = await Strategy.find({ user: this.req.user.id })
    if (!strategies) {
      this.res.serverError()
    }
    return { strategies }
  }

}
