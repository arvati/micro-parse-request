const ipware = require('ipware');
const URL = require('url').URL
const originalurl = require('original-url');
const cookie = require('cookie');
const crypto = require('crypto');
const qs = require('qs');
const pathToRegexp = require('path-to-regexp')

const parse = (req,res, {secret, keyPair, cookie, query = { ignoreQueryPrefix: true }, path = '', param}) => {
    const reqParse = {}, resParse = {}
    const {origin, protocol, host, hostname, port, pathname, search, hash} = new URL(originalurl(req).full)
    const ipInfo = getIp(req)
    const Cookies = getCookies(req, keyPair.publicKey)
    if (!query.ignoreQueryPrefix) query.ignoreQueryPrefix = true

    req = Object.assign(reqParse, Cookies, {
        secret,
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
        search,
        query: qs.parse(search, query),
        params: getParams(path, pathname, param),
        matched: pathMatch(path, pathname, param)
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

const getCookies = (request, publicKey) => {
    var cookiesHeader = request.headers.cookie
    var cookies = Object.create(null);
    var signedCookies = Object.create(null);
    if (!cookiesHeader) return {cookies, signedCookies}

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
        return verify(str.slice(2), publicKey)
      }
    const getSignedCookies = (obj) => {
        var ret = Object.create(null)
        for (const key of Object.keys(obj)) {
            var dec = getSignedCookie(obj[key])
            if (obj[key] !== dec) {
                ret[key] = dec
                delete obj[key]
            }
        }
        return ret
    }
    cookies = cookie.parse(cookiesHeader)
    if (!publicKey) {
        signedCookies = getSignedCookies(cookies)
        signedCookies = getJSONCookies(signedCookies)
    }
    cookies = getJSONCookies(cookies)
    return {cookies, signedCookies}
}

const setCookies = (response, name, value, secret, options = {}) => {
    if (secret) options.signed = true;
    var val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);
    if ('maxAge' in options) {
        options.expires = new Date(Date.now() + options.maxAge);
        options.maxAge /= 1000;
    }
    if (options.path == null) options.path = '/';
    if (options.signed)  val = 's:' + sign(val, secret);
    response.setHeader('Set-Cookie', cookie.serialize(name, String(val), options));
}

const sign = (value, privateKey, secret) => {
    var signature = crypto.createSign("RSA-SHA256").update(value).sign({key:privateKey,passphrase: secret,padding:crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength:10}, "base64");
    return value + '.' + signature.replace(/\=+$/, '')
}

const verify = (value, publicKey) => {
    var str = value.slice(0, value.lastIndexOf('.'))
    var signature = value.slice(value.lastIndexOf('.')+1)
    var verified = crypto.createVerify("RSA-SHA256").update(str).verify({key:publicKey, padding:crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength:10}, signature, "base64");
    return verified ? str : false;
}

const querySearch = (object, options = { addQueryPrefix: true }) => {
    if (!options.addQueryPrefix) options.addQueryPrefix = true
    return qs.stringify(object, options);
}

const pathMatch = (path = '', pathname, options = {}) => {
    return pathToRegexp(path, [], options).test(pathname)
}

const getParams = (path = '', pathname, options = {}) => {
    var keys = [];
    var m = pathToRegexp(path, keys, options).exec(pathname) || [];
    return  keys.reduce( 
        (params,key,i) => {
            param = m[i+1];
            if (param) {
                params[key.name] = decodeURIComponent(param);
                if (key.repeat) params[key.name] = params[key.name].split(key.delimiter)
            }
            return params
        }, Object.create(null))
}

const getKeyPair = (secret , size = 1024) => {
    options = {
        modulusLength: size,
        publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
        },
        privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: secret
        }
    }
    return {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', options)
}

module.exports = parse;
module.exports.utils = {getKeyPair, querySearch, pathMatch, sign, verify};
