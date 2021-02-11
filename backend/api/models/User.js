const API_ERRORS = require('../constants/APIErrors')

/**
 * User.js
 * @name global.User
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
const User = {
  tableName: 'users',
  attributes: {
    firstName: {
      type: 'string',
      required: true,
      columnName: 'first_name'
    },

    lastName: {
      type: 'string',
      required: true,
      columnName: 'last_name'
    },

    email: {
      type: 'string',
      required: true,
      unique: true
    },

    password: {
      type: 'string',
      required: true
    },

    passwordResetToken: {
      type: 'string',
      description:
        'A unique token used to verify the user\'s identity when recovering a password.',
      columnName: 'password_reset_token'
    },

    passwordResetTokenExpiresAt: {
      type: 'number',
      description: 'A timestamp representing the moment when this user\'s `passwordResetToken` will expire (or 0 if the user currently has no such token).',
      example: 1508944074211,
      columnName: 'password_reset_token_expires_at'
    },

    emailStatus: {
      type: 'string',
      isIn: ['unconfirmed', 'confirmed'],
      defaultsTo: 'unconfirmed',
      columnName: 'email_status'
    },

    emailProofToken: {
      type: 'string',
      description: 'This will be used in the account verification email',
      columnName: 'email_proof_token'
    },

    coinBaseApiKey: {
      type: 'string',
      description: 'The key for the coin base api',
      columnName: 'coin_base_api_key',
      encrypt: true
    },

    coinBaseApiSecret: {
      type: 'string',
      description: 'The secret for the coin base api',
      columnName: 'coin_base_api_secret',
      encrypt: true
    },

    coinBaseApiPhrase: {
      type: 'string',
      description: 'The pass phrase for the coin base api',
      columnName: 'coin_base_api_phrase',
      encrypt: true
    },

    paperCoinBaseApiKey: {
      type: 'string',
      description: 'The paper key for the coin base api',
      columnName: 'paper_coin_base_api_key',
      encrypt: true
    },

    paperCoinBaseApiSecret: {
      type: 'string',
      description: 'The paper secret for the coin base api',
      columnName: 'paper_coin_base_api_secret',
      encrypt: true
    },

    paperCoinBaseApiPhrase: {
      type: 'string',
      description: 'The paper pass phrase for the coin base api',
      columnName: 'paper_coin_base_api_phrase',
      encrypt: true
    },

    strategies: {
      collection: 'Strategy',
      via: 'user'
    }
  },
  customToJSON () {
    const user = _.omit(this, ['password'])
    user.fullName = [user.firstName, user.lastName].join(' ')
    return user
  },
  async beforeCreate (user, done) {
    user.email = user.email.toLowerCase()
    user.password = await sails.helpers.passwords.hashPassword(user.password)
    user.emailProofToken = await sails.helpers.strings.random('url-friendly')
    done()
  },

  /**
   * Creates a new user
   * @returns {Promise}
   * @param data {Object}
   */
  async createUser (data) {
    const user = await sails.models.user.create(data)
      .intercept('E_UNIQUE', () => new Error('The provided email address is already in use.'))
      .intercept('UsageError', () => new Error('Unable to save user')).fetch()
    // Send "confirm account" email
    await sails.helpers.emails.sendTemplateEmail.with({
      to: user.email,
      subject: 'Please confirm your account',
      template: 'email-verify-account',
      ensureAck: true,
      templateData: {
        fullName: [user.firstName, user.lastName].join(' '),
        token: user.emailProofToken
      }
    }).catch(async (e) => {
      await sails.models.user.destroyOne({ id: user.id })
      throw e
    })
    return user
  },

  /**
   * Generates password reset token
   * @param email
   * @returns {Promise}
   */
  async generateResetToken (email) {
    const user = await this.findOne({ email })
    if (!user) { return new Error(API_ERRORS.USER_NOT_FOUND) }
    user.resetToken = await sails.helpers.strings.random('url-friendly')
    await user.save()

    // Send "confirm account" email
    await sails.helpers.sendTemplateEmail.with({
      to: user.email,
      subject: 'Please confirm your account',
      template: 'email-verify-account',
      templateData: {
        fullName: user.fullName,
        token: user.emailProofToken
      }
    })
  },

  /**
   * Changes password
   * @param email
   * @param currentPassword
   * @param newPassword
   * @returns {Promise}
   */
  changePassword (email, currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      UserManager
        .validatePassword(email, currentPassword)
        .then(({ isValid, user }) => {
          if (!isValid) {
            return reject(API_ERRORS.INVALID_PASSWORD)
          } else {
            user
              .setPassword(newPassword)
              .then(() => {
                user.resetToken = null
                user.passwordFailures = 0
                user.lastPasswordFailure = null
                user.save()

                UserManager._generateUserToken(user, (token) => {
                  resolve(token)
                })
              })
              .catch(reject)
          }
        })
        .catch(reject)
    })
  },

  /**
   * Resets password to a new one by reset token.
   * @param email
   * @param resetToken
   * @param newPassword
   * @returns {Promise}
   */
  resetPasswordByResetToken (email, resetToken, newPassword) {
    return new Promise((resolve, reject) => {
      User
        .findOne({ email, resetToken })
        .exec(async (err, user) => {
          if (err) {
            return reject(err)
          } // Query error
          if (!user) {
            return reject(API_ERRORS.USER_NOT_FOUND)
          }

          // TODO Check reset token validity

          user.password = newPassword
          user.resetToken = null
          user.passwordFailures = 0
          user.lastPasswordFailure = null
          await user.save()

          resolve()
        })
    })
  }
}

module.exports = User
