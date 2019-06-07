const microParseRequest = require('../lib/');
const {getKeyPair, querySearch, pathMatch, sign, verify} = microParseRequest.utils

const options ={
  secret: process.env.COOKIESECRET,
  cookie: {},
  query:{},
  path: ['/micro/param1/:id1/(.*)','/micro/param2/:id2/(.*)'],
  param:{}
}
options.keyPair = getKeyPair(options.secret, {type:'ec', namedCurve:'P-256K'})

const parseRequest = microParseRequest(options)

module.exports = parseRequest(async (req, res, parse) => {

  querysearch = querySearch(parse.req.query)
  pathmatch = pathMatch(options.path, parse.req.path)
  signed = await sign('hello world',options.keyPair.privateKey, options.secret)
  verifed = await verify(signed,options.keyPair.publicKey)

  const properties = [
    "originalUrl",
    "origin",
    "protocol",
    "port",
    "ip",
    "ipRoutable",
    "host",
    "hostname",
    "path",
    "secure",
    "nowurl",
    "hash",
    "search",
    "query",
    "params",
    "matched",
    "cookies",
    "signedCookies"
  ]
  filterReq = properties.reduce((acc,cur) => Object.assign(acc,{[cur]:req[cur]})
  ,{})

  return {req:filterReq, parse, querysearch, pathmatch, signed, verifed}
  })