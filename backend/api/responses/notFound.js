/**
 * 404 (Not Found) Handler
 *
 */

module.exports = function notFound () {
  // Get access to `req` and `res`
  const res = this.res

  // Set status code
  res.status(404)

  res.json({
    message: 'Method Not Found'
  })
}
