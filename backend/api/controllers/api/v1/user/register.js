module.exports = {

  friendlyName: 'Register',

  description: 'Register user.',

  inputs: {
    firstName: {
      type: 'string',
      required: true
    },
    lastName: {
      type: 'string',
      required: true
    },
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
    success: {
      statusCode: 201,
      description: 'New user created'
    },
    invalid: {
      responseType: 'badRequest',
      description: 'The provided fullName, password and/or email address are invalid.',
      extendedDescription: 'If this request was sent from a graphical user interface, the request ' +
        'parameters should have been validated/coerced _before_ they were sent.'
    },
    emailAlreadyInUse: {
      statusCode: 409,
      description: 'The provided email address is already in use.',
      responseType: 'serverError'
    }
  },

  async fn ({ firstName, lastName, email, password }, exits) {
    const user = await User.createUser({
      firstName,
      lastName,
      email,
      password
    })
    this.res.ok()
  }
}
