/**
 * Module dependencies
 */

const _ = require('@sailshq/lodash')
const flaverr = require('flaverr')

/**
 * 500 (Server Error) Response
 *
 * Usage:
 * return res.serverError();
 * return res.serverError(err);
 * return res.serverError(err, 'some/specific/error/view');
 *
 * NOTE:
 * If something throws in a policy or controller, or an internal
 * error is encountered, Sails will call `res.serverError()`
 * automatically.
 */

module.exports = function serverError (data) {
  // Get access to `req` and `res`
  const req = this.req
  const res = this.res

  // Get access to `sails`
  const sails = req._sails

  // Log error to console
  if (data !== undefined) {
    sails.log.error('Sending 500 ("Server Error") response: \n', flaverr.parseError(data) || data)
  }

  // Don't output error data with response in production.
  const dontRevealErrorInResponse = process.env.NODE_ENV === 'production'

  // Set status code
  res.status(500)

  if (data === undefined) {
    data = { message: 'Internal Error' }
  }
  // If the data is an error instance and it doesn't have a custom .toJSON(),
  // use its stack instead (otherwise res.json() will turn it into an empty dictionary).
  if (_.isError(data)) {
    if (!_.isFunction(data.toJSON)) {
      data = { message: data.message || 'Internal Error', errors: dontRevealErrorInResponse ? [] : [data.stack] }
    }
  } else if (_.isString(data)) {
    data = { message: data }
  }
  data.success = false
  return res.json(data)
}
