const parseRequest = require('.');

module.exports = parseRequest(async function(req, res) {
    return 'Hello World!'
  })