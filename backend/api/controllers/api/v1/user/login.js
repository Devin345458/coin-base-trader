const passport = require('passport')
module.exports = {

  friendlyName: 'Login',

  description: 'Login something.',

  inputs: {
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6
    }
  },

  exits: {

  },

  async fn ({ email, password }, exits, env) {
    await new Promise(async (resolve, reject) => {
      const user = await passport.authenticate('credentials', async (error, user, info) => {
        if (error) {
          this.res.serverError(error)
          return reject(error)
        }
        if (!user) {
          this.res.unauthorized(null, info && info.code, info && info.message)
          return reject(new Error('E_UNAUTHORIZED'))
        }

        this.res.ok({
          token: await sails.helpers.getToken(user),
          user
        })
        resolve()
      })(env.req, env.res)
    })
  }
}
