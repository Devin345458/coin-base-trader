const jwt = require('jsonwebtoken')
/**
 * @name sails.helpers.getToken
 * @type {{exits: {success: {outputFriendlyName: string, outputDescription: string}}, inputs: {user: {description: string, type: string}}, fn: (function({user: *}): *), description: string, friendlyName: string}}
 */
module.exports = {

  friendlyName: 'Get token',

  description: 'Generates a jwt token ',

  inputs: {
    user: {
      type: 'ref',
      description: 'The user to create the token for'
    }
  },

  exits: {

    success: {
      outputFriendlyName: 'Token',
      outputDescription: 'The jwt token '
    }

  },

  async fn ({ user }) {
    return await jwt.sign({
      user: user.toJSON()
    },
    sails.config.jwtSettings.secret,
    {
      algorithm: sails.config.jwtSettings.algorithm,
      expiresIn: sails.config.jwtSettings.expiresInSeconds,
      issuer: sails.config.jwtSettings.issuer,
      audience: sails.config.jwtSettings.audience
    }
    )
  }

}
