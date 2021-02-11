/*
*   The official coinbase-pro library (https://www.npmjs.com/package/coinbase-pro) has been deprecated as of January 16th, 2020.
*   The coinbase-pro library still works but it doesn't support all of the API endpoints being used by this project. As a work
*   around, this file will create a library that supports those other methods needed for this bot to run.
*/
const crypto = require('crypto')
const axios = require('axios')
const numberOfAttempts = 3

/**
 * Class: This class creates an easy way to create methods to call API endpoints. It stores
 * the needed information upon construction and provides a method to sign messages. Which
 * can then be used to create more endpoint calling methods.
 */
class CoinbaseProLibrary {
  /**
   * Summary: constructs an instance of this class that can be used to make the API endpoint calls
   *
   * @param {Object} user
   */
  constructor (user, mode) {
    const apiURI = 'https://api.pro.coinbase.com'
    const sandboxURI = 'https://api-public.sandbox.pro.coinbase.com'
    this.apiKey = mode === 'Paper' ? user.paperCoinBaseApiKey : user.coinBaseApiKey
    this.apiSecret = mode === 'Paper' ? user.paperCoinBaseApiSecret : user.coinBaseApiSecret
    this.apiPassphrase = mode === 'Paper' ? user.paperCoinBaseApiPhrase : user.coinBaseApiPhrase
    this.apiURI = process.env.NODE_ENV === 'production' ? apiURI : sandboxURI
  }

  /**
   * Creates the CB-ACCESS-SIGN header needed for executing a coinbase pro REST API endpoint call.
   *
   * @param {string|null} method
   * @param {string|null} requestPath
   * @param {string|null} body
   *
   * @return {string} CB-ACCESS-SIGN value
   */
  signMessage (method, requestPath, body) {
    try {
      if (method === null || requestPath === null) {
        Error('Error in signMessage method, method or requestPath is null!')
      }

      const timestamp = Date.now() / 1000

      let what

      if (body === null) {
        what = timestamp + method + requestPath
      } else {
        what = timestamp + method + requestPath + JSON.stringify(body)
      }

      // decode the base64 secret
      const key = Buffer.from(this.apiSecret, 'base64')

      // create a sha256 hmac with the secret
      const hmac = crypto.createHmac('sha256', key)

      // sign the require message with the hmac
      // and finally base64 encode the result
      return hmac.update(what).digest('base64')
    } catch (err) {
      const message = 'Error occurred in signMessage method.'
      const errorMsg = new Error(err)
      sails.log.error({ message, errorMsg, err })
      throw err
    }
  }

  /**
   * Calls the endpoint /profiles to get a list of the available portfolio (profile) IDs for the account
   * Check the documentation for more information on this endpoint.
   *
   * @return {string} API call response data
   */
  async getProfiles () {
    let attempts = 0

    while (attempts < numberOfAttempts) {
      try {
        const method = 'GET'
        const requestPath = '/profiles'
        const body = null
        const timestamp = Date.now() / 1000

        const sign = await this.signMessage(method, requestPath, body)

        const headers = {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': sign,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-ACCESS-PASSPHRASE': this.apiPassphrase
        }

        const fullpath = this.apiURI + requestPath

        // Call API:
        const result = await axios.get(fullpath, { headers })

        return result.data
      } catch (err) {
        if (attempts < numberOfAttempts - 1) {
          attempts++
        } else {
          const message = 'Error occurred in getProfiles method. Number of attempts: ' + numberOfAttempts
          const errorMsg = new Error(err)
          sails.log.error({ message, errorMsg, err })
          throw err
        }
      }
    }
  }

  /**
   * Calls the endpoint /fees to get the current maker and taker fees
   * Check the documentation for more information on this endpoint.
   *
   * Re-attempts: 3
   *
   * @return {array} API call response data
   */
  async getFees () {
    let attempts = 0

    while (attempts < numberOfAttempts) {
      try {
        const method = 'GET'
        const requestPath = '/fees'
        const body = null
        const timestamp = Date.now() / 1000

        const sign = await this.signMessage(method, requestPath, body)

        const headers = {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': sign,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-ACCESS-PASSPHRASE': this.apiPassphrase
        }

        const fullpath = this.apiURI + requestPath

        // Call API:
        const result = await axios.get(fullpath, { headers })

        return result.data
      } catch (err) {
        if (attempts < numberOfAttempts - 1) {
          attempts++
        } else {
          const message = 'Error occurred in getFees method. Number of attempts: ' + numberOfAttempts
          const errorMsg = new Error(err)
          sails.log.error({ message, errorMsg, err })
          throw err
        }
      }
    }
  }

  /**
   * Calls the /profiles/transfer endpoint that will let you transfer some currency from one profile to another.
   * The fromProfileID must be the profile linked to the API key provided, this is where the funds are sourced.
   * Check the coinbase pro api docs for more information on the restrictions around this endpoint.
   *
   * @param {string} fromProfileID
   * @param {string} toProfileID
   * @param {string} currency
   * @param {string} amount
   *
   * Re-attempts: 3
   *
   * @return {string} data from the response
   */
  async profileTransfer (fromProfileID, toProfileID, currency, amount) {
    let attempts = 0

    while (attempts < numberOfAttempts) {
      try {
        const method = 'POST'
        const requestPath = '/profiles/transfer'
        const body = {
          from: fromProfileID,
          to: toProfileID,
          currency,
          amount
        }

        const timestamp = Date.now() / 1000

        const sign = await this.signMessage(method, requestPath, body)

        const headers = {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': sign,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-ACCESS-PASSPHRASE': this.apiPassphrase
        }

        const fullpath = this.apiURI + requestPath

        // Call API:
        const result = await axios.post(fullpath, body, { headers })

        return result.data
      } catch (err) {
        if (attempts < numberOfAttempts - 1) {
          attempts++
        } else {
          const message = 'Error occurred in profileTransfer method. Number of attempts: ' + numberOfAttempts
          const errorMsg = new Error(err)
          sails.log.error({ message, errorMsg, err })
          throw err
        }
      }
    }
  }
}

module.exports = CoinbaseProLibrary
