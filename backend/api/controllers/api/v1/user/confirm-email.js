module.exports = {

  friendlyName: 'Confirm email',

  description:
`Confirm a new user's email address, or an existing user's request for an email address change,
then redirect to either a special landing page (for newly-signed up users), or the account page
(for existing users who just changed their email address).`,

  inputs: {

    token: {
      description: 'The confirmation token from the email.',
      example: '4-32fad81jdaf$329'
    }

  },

  exits: {

    success: {
      description: 'Email address confirmed and requesting user logged in.'
    },

    redirect: {
      description: 'Email address confirmed and requesting user logged in.  Since this looks like a browser, redirecting...',
      responseType: 'redirect'
    },

    invalidOrExpiredToken: {
      responseType: 'expired',
      description: 'The provided token is expired, invalid, or already used up.'
    },

    emailAddressNoLongerAvailable: {
      statusCode: 409,
      viewTemplatePath: '500',
      description: 'The email address is no longer available.',
      extendedDescription: 'This is an edge case that is not always anticipated by websites and APIs.  Since it is pretty rare, the 500 server error page is used as a simple catch-all.  If this becomes important in the future, this could easily be expanded into a custom error page or resolution flow.  But for context: this behavior of showing the 500 server error page mimics how popular apps like Slack behave under the same circumstances.'
    }

  },

  async fn ({ token }) {
    // If no token was provided, this is automatically invalid.
    if (!token) {
      throw 'invalidOrExpiredToken'
    }

    // Get the user with the matching email token.
    const user = await User.findOne({ emailProofToken: token })

    // If no such user exists, or their token is expired, bail.
    if (!user) {
      throw 'invalidOrExpiredToken'
    }

    if (user.emailStatus === 'unconfirmed') {
      //  ┌─┐┌─┐┌┐┌┌─┐┬┬─┐┌┬┐┬┌┐┌┌─┐  ╔═╗╦╦═╗╔═╗╔╦╗ ╔╦╗╦╔╦╗╔═╗  ╦ ╦╔═╗╔═╗╦═╗  ┌─┐┌┬┐┌─┐┬┬
      //  │  │ ││││├┤ │├┬┘││││││││ ┬  ╠╣ ║╠╦╝╚═╗ ║───║ ║║║║║╣   ║ ║╚═╗║╣ ╠╦╝  ├┤ │││├─┤││
      //  └─┘└─┘┘└┘└  ┴┴└─┴ ┴┴┘└┘└─┘  ╚  ╩╩╚═╚═╝ ╩   ╩ ╩╩ ╩╚═╝  ╚═╝╚═╝╚═╝╩╚═  └─┘┴ ┴┴ ┴┴┴─┘
      // If this is a new user confirming their email for the first time,
      // then just update the state of their user record in the database,
      // store their user id in the session (just in case they aren't logged
      // in already), and then redirect them to the "email confirmed" page.
      await User.updateOne({ id: user.id }).set({
        emailStatus: 'confirmed',
        emailProofToken: ''
      })

      this.res.ok()
    } else {
      throw new Error(`Consistency violation: User ${user.id} has an email proof token, but somehow also has an emailStatus of "${user.emailStatus}"!  (This should never happen.)`)
    }
  }

}
