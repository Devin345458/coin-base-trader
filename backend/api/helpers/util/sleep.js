module.exports = {

  friendlyName: 'Sleep',

  description: 'Sleep util.',

  inputs: {
    time: {
      type: 'number',
      description: 'Number of ms to sleep'
    }
  },

  exits: {

    success: {
      description: 'All done.'
    }

  },

  // eslint-disable-next-line require-await
  async fn ({ time }) {
    return new Promise((resolve) => {
      setTimeout(resolve, time)
    })
  }

}
