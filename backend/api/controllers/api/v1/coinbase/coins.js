const CoinbasePro = require('coinbase-pro')

module.exports = {

  friendlyName: 'Coins',

  description: 'Get all coins',

  inputs: {
    paper: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Whether to query to public or sandbox api'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'The coins were successfully found'
    },
    error: {
      responseType: 'serverError',
      description: 'The api request errored'
    }
  },

  async fn ({ paper }, exits) {
    const publicClient = new CoinbasePro.PublicClient(paper ? sails.config.coinbase.sandboxURI : sails.config.coinbase.apiURI)
    let coins = await publicClient.getProducts()
    if (!coins) {
      return exits.error()
    }
    coins = coins.filter((coin) => {
      return coin.quote_currency === 'USD'
    })
    return exits.success({ coins })
  }

}
