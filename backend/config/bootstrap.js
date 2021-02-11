/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */
const TradeManager = require('./../api/classes/tradeManager')
const NodeCache = require('node-cache')

module.exports.bootstrap = async function () {
  await new TradeManager().initialize()

  sails.cache = new NodeCache()
}
