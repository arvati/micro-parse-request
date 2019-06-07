const ipware = require('ipware');
const URL = require('url').URL
const originalurl = require('original-url');
const cookie = require('cookie');
const cryptoKeys = require('crypto-keys');
const Crypt = require('simple-crypt').Crypt
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
    key = new cryptoKeys('pem', privateKey);
    if (!secret) key.decrypt(secret)
    Crypt.make({key: key.pem, is_private: true}, function (err, signer) {
        signer.sign(value, function (err, signed) {
            if (err) throw err instanceof Error ? err : new Error(err);
            return value + '.' + signed.replace(/\=+$/, '')
        });
    });
}

const verify = (value, publicKey) => {
    key = new cryptoKeys('pem', publicKey);
    var str = value.slice(0, value.lastIndexOf('.'))
    var signature = value.slice(value.lastIndexOf('.')+1)

    Crypt.make({key: key.pem, is_public: true}, function (err, verifier) {
        verifier.verify(signature, function (err, verified){
            if (err) throw err instanceof Error ? err : new Error(err);
            console.debug(verified)
            return verified ? str : false;
        });
    });
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

const getKeyPair = (secret , options = {type:'ec', namedCurve:'P-256K', modulusLength:2048, publicExponent:65537}) => {
    privateKey = new cryptoKeys('create', options);
    publicKey = new cryptoKeys('jwk', privateKey.export('jwk', {outputPublic: true}) )
    if (!secret) privateKey.encrypt(secret)
    return {publicKey: publicKey.pem, privateKey: privateKey.pem}
}

module.exports = parse;
module.exports.utils = {getKeyPair, querySearch, pathMatch, sign, verify};
