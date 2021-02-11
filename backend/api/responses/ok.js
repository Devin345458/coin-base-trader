/**
 * Module dependencies
 */

const util = require('util')
const _ = require('@sailshq/lodash')

/**
 * 200 (OK) Response
 *
 * Usage:
 * return res.ok();
 * return res.ok(data);
 *
 * @param  {JSON?} data
 * @param  {Ref?} noLongerSupported
 */

module.exports = function sendOK (data) {
  const res = this.res

  // Set status code
  res.status(200)

  // If no data was provided, use res.sendStatus().
  if (_.isObject(data)) {
    data.success = true
  } else if (_.isString(data)) {
    data = {
      success: true,
      message: data
    }
  } else if (_.isError(data)) {
    data = {
      success: false,
      message: data.message
    }
  } else {
    data = { success: true }
  }

  return res.json(data)
}
