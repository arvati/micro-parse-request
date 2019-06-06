const send = require('micro').send;
const microParseRequest = require('../lib/');
const {getKeyPair, querySearch, pathMatch, sign, verify} = microParseRequest.utils

const options ={
  secret: process.env.COOKIESECRET,
  cookie: {},
  query:{},
  path: ['/micro/param1/:id1/(.*)','/micro/param2/:id2/(.*)'],
  param:{}
}
options.keyPair = getKeyPair(options.secret, 1024)

const parseRequest = microParseRequest(options)

module.exports = parseRequest(async (req, res, parse) => {

  querysearch = querySearch(parse.req.query)
  pathmatch = pathMatch(options.path, parse.req.path)
  signed = sign('hello world',options.keyPair.privateKey, options.secret)
  verifed = verify(signed,options.keyPair.publicKey)

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
req.query: ${JSON.stringify(req.query)},
req.params: ${JSON.stringify(req.params)},
req.matched: ${req.matched},
req.cookies: ${JSON.stringify(req.cookies)},
req.signedCookies: ${JSON.stringify(req.signedCookies)}

Parse Argument (parse): 
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
parse.req.query: ${JSON.stringify(parse.req.query)},
parse.req.params: ${JSON.stringify(parse.req.params)},
parse.req.matched: ${parse.req.matched},
parse.req.cookies: ${JSON.stringify(parse.req.cookies)},
parse.req.signedCookies: ${JSON.stringify(parse.req.signedCookies)}

parse.utils.querySearch: ${querysearch},
parse.utils.pathMatch: ${pathmatch},
parse.utils.sign: ${signed},
parse.utils.verify: ${verifed}
`)
  })