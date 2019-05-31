const send = require('micro').send;
const microParseRequest = require('.');

const options ={
  secret: process.env.COOKIESECRET,
  cookie: {}
}

const parseRequest = microParseRequest(options)

module.exports = parseRequest(async (req, res, parse) => {
    return send(res,200,
`Incomming Message (req): 
req.secret: would be just req.secret,
req.originalUrl: ${req.originalUrl},
req.origin: ${req.origin},
req.protocol: ${req.protocol},
req.port: ${req.port},
req.ip: ${req.ip},
req.ipRoutable: ${req.ipRoutable},
req.host: ${req.host},
req.hostname: ${req.hostname},
req.path: ${req.path},
req.secure: ${req.secure},
req.nowurl: ${req.nowurl},
req.hash: ${req.hash},
req.search: ${req.search},
req.cookies: ${req.cookies},
req.signedCookies: ${req.signedCookies}

Parse (parse): 
parse.req.secret: would be just parse.req.secret,
parse.req.originalUrl: ${parse.req.originalUrl},
parse.req.origin: ${parse.req.origin},
parse.req.protocol: ${parse.req.protocol},
parse.req.port: ${parse.req.port},
parse.req.ip: ${parse.req.ip},
parse.req.ipRoutable: ${parse.req.ipRoutable},
parse.req.host: ${parse.req.host},
parse.req.hostname: ${parse.req.hostname},
parse.req.path: ${parse.req.path},
parse.req.secure: ${parse.req.secure},
parse.req.nowurl: ${parse.req.nowurl},
parse.req.hash: ${parse.req.hash},
parse.req.search: ${parse.req.search},
parse.req.cookies: ${parse.req.cookies},
parse.req.signedCookies: ${parse.req.signedCookies}`)
  })