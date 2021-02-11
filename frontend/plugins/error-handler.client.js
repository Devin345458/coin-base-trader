// Lib imports
import Vue from 'vue'
const vue = new Vue()
export default (context, inject) => {
  const errorHandler = (status, message = 'Unknown Error', problems = false) => {
    if (status !== 200) {
      if (message === 'canceled') { return true }
      if (problems) {
        problems.forEach((problem) => {
          vue.$noty.error(problem)
        })
      } else {
        vue.$noty.error(message)
      }
      return true
    }
    return false
  }

  inject('error', errorHandler)
  context.$error = errorHandler
}
