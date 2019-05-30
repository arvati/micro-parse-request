const {is_private_ip, is_valid_ip, is_loopback_ip, cleanup_ip} = require('ipware')();
const originalurl = require('original-url');
const cookie = require('cookie')
const signature = require('cookie-signature')
const pathToRegexp = require('path-to-regexp')

module.exports = handler => (req, res) => {
    
    const getIp = (request) => {
        //testing manually because do not want req to be populated with attibutes.
        return [
            "HTTP_X_FORWARDED_FOR",
            "HTTP_CLIENT_IP",
            "HTTP_X_REAL_IP",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "CF-Connecting-IP",
            "X-Real-IP",
            "X-Client-IP",
            "X-Forwarded-For",
            "REMOTE_ADDR"
          ].reduce(
                    (acc, key) => (req.headers[key] || 
                            req.headers[key.toUpperCase()] ||
                            req.headers[key.toLowerCase()] ||
                            req.headers[key.toLowerCase().replace(/_/g, '-')] ||
                            req.headers[key.toUpperCase().replace(/_/g, '-')] ||
                            request.connection.remoteAddress || '127.0.0.1').split(/\s*,\s*/).reduce(
                                (ret, cur) => {
                                    last = cleanup_ip(ret)
                                    if (last && is_valid_ip(last) && !is_private_ip(last)) return last 
                                    else {
                                        ip = cleanup_ip(cur)
                                        if (ip && is_valid_ip(ip)) {
                                            if (is_private_ip(ip)) {
                                                if (!last || (!is_loopback_ip(ip) && is_loopback_ip(last))) return ip
                                            } else return ip
                                        }
                                        else return last
                                    }
                                }, 
                                acc
                            )
                    ) || '127.0.0.1';
    }
    
    const getNow = (request) =>{
        return request.headers['x-now-deployment-url'] || '';
    }

    const getCookies = (request, secret) => {
        var secrets = !secret || Array.isArray(secret) ? (secret || []) : [secret]
        var cookiesHeader = request.headers.cookie
        if (!cookiesHeader) return null

        const JSONCookie = (str) => {
            if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') return undefined 
            try { 
                return JSON.parse(str.slice(2))
            } catch (err) { 
                return undefined
            }
        }
        const JSONCookies = (obj) => {
            for (const key of Object.keys(obj)) {
                var val = JSONCookie(obj[key])
                if (val) obj[key] = val
            }          
            return obj
        }
        const signedCookie = (str) => {
            if (typeof str !== 'string') return undefined
            if (str.substr(0, 2) !== 's:') return str
            return secrets.reduce( (acc,cur) => (!acc) ? signature.unsign(str.slice(2), cur) : false, false )
          }
        const signedCookies = (obj) => {
            var ret = Object.create(null)
            for (const key of Object.keys(obj)) {
                var dec = signedCookie(obj[key], secret)
                if (obj[key] !== dec) {
                    ret[key] = dec
                    delete obj[key]
                }
            }
            return ret
        }

        var cookies = cookie.parse(cookiesHeader)
            // parse signed cookies
        if (secrets.length !== 0) {
            var signedCookies = signedCookies(cookies, secrets)
            signedCookies = JSONCookies(signedCookies)
        }
        cookies = JSONCookies(cookies)
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
        if (options.signed)  val = 's:' + signature.sign(val, secret);
        response.setHeader('Set-Cookie', cookie.serialize(name, String(val), options));
    }

    req['originalUrl'] = req.url
    const {origin, protocol, host, hostname, port, pathname, search, hash} = new URL(originalurl(req).full)
    req["origin"] = origin
    req["protocol"] = protocol
    req["host"] = host
    req["hostname"] = hostname
    req["port"] = port !== '' ? Number(port) : undefined
    req["path"] = pathname
    req["hash"] = hash // Only here for documentation pourposes
    req["search"] = search // https://nodejs.org/api/url.html#url_class_urlsearchparams
    req["secure"] = ('https' == protocol)
    req["ip"] = getIp(req)
    req["ipRoutable"] = !is_private_ip(req.ip);
    req["nowUrl"] = getNow(req)

    req.cookies = Object.create(null)
    req.signedCookies = Object.create(null)
    const {cookies, signedCookies} = getCookies(req, "secret", options)
    req = Object.assign(req, {cookies, signedCookies} )

    const newReq = Object.assign({}, req, { cookies });
    const newRes = Object.assign({}, res, {});
    return handler(newReq, newRes);
}