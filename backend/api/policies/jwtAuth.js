/**
 * JWT Auth Policy
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user via JWT token
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
const passport = require('passport')

module.exports = function (req, res, next) {
  if (req.isSocket) { return next() }
  /**
   * isAuthenticated
   * @description :: Policy to inject user in req via JSON Web Token
   */
  passport.authenticate('jwt', (error, user, info) => {
    if (error) { return res.serverError(error) }
    if (!user) { return res.unauthorized(null, info && info.code, info && info.message) }
    req.user = user
    next()
  })(req, res)
}
