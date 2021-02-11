/**
 * Passport configuration file where you should configure strategies
 */
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const EXPIRES_IN_SECONDS = 60 * 24 * 60
const SECRET = process.env.tokenSecret || 'phie6vaecheliekeeru8aiy4shuafiJ0'
const ALGORITHM = 'HS256'
const ISSUER = 'coin-base-trader.com'
const AUDIENCE = 'coin-base-trader.com'

/**
 * Configuration object for local strategy
 */
const LOCAL_STRATEGY_CONFIG = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false
}

/**
 * Configuration object for JWT strategy
 */
const JWT_STRATEGY_CONFIG = {
  secretOrKey: SECRET,
  issuer: ISSUER,
  audience: AUDIENCE,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: false
}

/**
 * Triggers when user authenticates via local strategy
 */
async function _onLocalStrategyAuth (email, password, next) {
  let user
  try {
    user = await User.findOne({ email }).decrypt()
    if (!user) {
      return next(null, false, { message: 'No user by that email' })
    }
  } catch (e) {
    return next(e)
  }
  await sails.helpers.passwords.checkPassword(password, user.password).intercept('incorrect', () => {
    return next(null, false, {
      code: 'E_WRONG_PASSWORD',
      message: 'Password is wrong'
    })
  })
  return next(null, user, {})
}

/**
 * Triggers when user authenticates via JWT strategy
 */
function _onJwtStrategyAuth (payload, next) {
  const user = payload.user
  return next(null, user, {})
}

passport.use('credentials', new LocalStrategy(LOCAL_STRATEGY_CONFIG, _onLocalStrategyAuth))
passport.use('jwt', new JwtStrategy(JWT_STRATEGY_CONFIG, _onJwtStrategyAuth))
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser((id, cb) => {
  User.findOne({ id }, (err, user) => {
    cb(err, user)
  })
})

module.exports.jwtSettings = {
  expiresInSeconds: EXPIRES_IN_SECONDS,
  secret: SECRET,
  algorithm: ALGORITHM,
  issuer: ISSUER,
  audience: AUDIENCE
}
