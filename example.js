const send = require('micro').send;
const microParseRequest = require('.');

const options ={
  secret: process.env.COOKIESECRET,
  cookie: {}
}

const parseRequest = microParseRequest(options)

module.exports = parseRequest(async (req, res) => {
    return send(res,200,
`secret: would be just req.secret,
originalUrl: ${req.originalUrl},
origin: ${req.origin},
protocol: ${req.protocol},
port: ${req.port},
ip: ${req.ip},
ipRoutable: ${req.ipRoutable},
host: ${req.host},
hostname: ${req.hostname},
path: ${req.path},
secure: ${req.secure},
nowurl: ${req.nowurl},
hash: ${req.hash},
search: ${req.search},
cookies: ${req.cookies},
signedCookies: ${req.signedCookies}`)
  })