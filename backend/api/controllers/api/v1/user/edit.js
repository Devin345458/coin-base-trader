module.exports = {

  friendlyName: 'Edit',

  description: 'Edit user.',

  inputs: {
    id: {
      type: 'number',
      required: true
    },
    firstName: {
      type: 'string',
      required: true
    },
    lastName: {
      type: 'string',
      required: true
    },
    coinBaseApiKey: {
      type: 'string',
      required: true
    },
    coinBaseApiSecret: {
      type: 'string',
      required: true
    },
    coinBaseApiPhrase: {
      type: 'string',
      required: true
    },
    paperCoinBaseApiKey: {
      type: 'string',
      required: true
    },
    paperCoinBaseApiSecret: {
      type: 'string',
      required: true
    },
    paperCoinBaseApiPhrase: {
      type: 'string',
      required: true
    }
  },

  exits: {

  },

  async fn (inputs) {
    const user = await User.updateOne({ id: inputs.id })
      .set(_.omit(inputs, ['id'])).decrypt()
    if (!user) {
      this.res.serverError()
    }
    this.res.ok({ user })
  }

}
