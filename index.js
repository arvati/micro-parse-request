
const parse = require('./parse')

module.exports = (options) => {
    return microparse = (next) => { return handler = async (req, res, ...args) => {
        const {reqParse,resParse} = parse(req,res,options)
        const newReq = Object.assign(req, reqParse);
        const newRes = Object.assign(res, resParse);
        return next(newReq, newRes);
    }}
}