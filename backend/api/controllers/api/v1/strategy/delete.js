module.exports = {

  friendlyName: 'Delete',

  description: 'Delete v 1.',

  inputs: {
    id: {
      type: 'ref',
      required: true,
      description: 'The id of the strategy to delete'
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'Record successfully deleted'
    },
    unableToDelete: {
      responseType: 'serverError',
      description: 'The response was unable to delete'
    }
  },

  async fn ({ id }, exits) {
    try {
      await Strategy.destroy(id).fetch()
      return exits.success({
        message: 'Successfully Deleted'
      })
    } catch (e) {
      return exits.unableToDelete(e)
    }
  }

}
