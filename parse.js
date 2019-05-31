const ipware = require('ipware');
const URL = require('url').URL
const originalurl = require('original-url');
const cookie = require('cookie')
const signature = require('cookie-signature')
const pathToRegexp = require('path-to-regexp')

const parse = (req,res, {secret, cookie}) => {
    const reqParse = {}, resParse = {}
    const {origin, protocol, host, hostname, port, pathname, search, hash} = new URL(originalurl(req).full)
    const ipInfo = getIp(req)
    const Cookies = getCookies(req, secret, cookie)

    req = Object.assign(reqParse, Cookies, {
        originalUrl: req.url,
        origin, 
        protocol, 
        port: (port !== '') ? Number(port) : undefined,
        ip : ipInfo.clientIp,
        ipRoutable: ipInfo.clientIpRoutable,
        host, 
        hostname, 
        path: pathname,
        secure: ('https' == protocol),
        nowurl: getNow(req),
        hash, 
        search
    })

    return {reqParse, resParse}
}

const getIp = (request) => {
    const get_ip = ipware(__dirname + '/ipware.json').get_ip;
    const localReq = Object.assign({},request);
    return ipInfo = get_ip(localReq)
}

const getNow = (request) =>{
    return request.headers['x-now-deployment-url'] || '';
}

const getCookies = (request, secret) => {
    var secrets = !secret || Array.isArray(secret) ? (secret || []) : [secret]
    var cookiesHeader = request.headers.cookie
    if (!cookiesHeader) return {cookies : null, signedCookies: null, secret: secrets[0]}

    const getJSONCookie = (str) => {
        if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') return undefined 
        try { 
            return JSON.parse(str.slice(2))
        } catch (err) { 
            return undefined
        }
    }
    const getJSONCookies = (obj) => {
        for (const key of Object.keys(obj)) {
            var val = getJSONCookie(obj[key])
            if (val) obj[key] = val
        }          
        return obj
    }
    const getSignedCookie = (str) => {
        if (typeof str !== 'string') return undefined
        if (str.substr(0, 2) !== 's:') return str
        return secrets.reduce( (acc,cur) => (!acc) ? signature.unsign(str.slice(2), cur) : false, false )
      }
    const getSignedCookies = (obj) => {
        var ret = Object.create(null)
        for (const key of Object.keys(obj)) {
            var dec = getSignedCookie(obj[key], secret)
            if (obj[key] !== dec) {
                ret[key] = dec
                delete obj[key]
            }
        }
        return ret
    }

    var cookies = Object.create(null);
    var signedCookies = Object.create(null);

    cookies = cookie.parse(cookiesHeader)
    if (secrets.length !== 0) {
        signedCookies = getSignedCookies(cookies, secrets)
        signedCookies = getJSONCookies(signedCookies)
    }
    cookies = getJSONCookies(cookies)
    return {cookies, signedCookies, secret: secrets[0]}
}

const setCookies = (response, name, value, secret, options = {}) => {
    if (secret) options.signed = true;
    var val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);
    if ('maxAge' in options) {
        options.expires = new Date(Date.now() + options.maxAge);
        options.maxAge /= 1000;
    }
    if (options.path == null) options.path = '/';
    if (options.signed)  val = 's:' + signature.sign(val, secret);
    response.setHeader('Set-Cookie', cookie.serialize(name, String(val), options));
}

module.exports = parse;