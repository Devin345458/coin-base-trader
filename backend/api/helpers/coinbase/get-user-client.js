const CoinbasePro = require('coinbase-pro')
module.exports = {

  friendlyName: 'Get users Coinbase client',

  description: 'Get users Coinbase client',

  inputs: {
    user: {
      type: 'ref',
      required: true
    }
  },

  exits: {

    success: {
      outputFriendlyName: 'User Coinbase client'
    }

  },

  async fn ({ user }) {
    const apiURI = 'https://api.pro.coinbase.com'
    const sandboxURI = 'https://api-public.sandbox.pro.coinbase.com'
    return new CoinbasePro.AuthenticatedClient(
      user.coinBaseApiKey,
      user.coinBaseApiSecret,
      user.coinBaseApiPhrase,
      process.env.NODE_ENV === 'production' ? apiURI : sandboxURI
    )
  }

}
