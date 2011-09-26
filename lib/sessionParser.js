/*!
 * Mitko Tschimev
 */

var http = require('http')
  , statusCodes = http.STATUS_CODES
  , url = require('url');

exports = module.exports = function sessionHandler(options){
  options = options || {};

  return function sessionHandler(req, res, next){
    
    /**
     * umbrella session parsing
     */
    var session_token = res.getHeader('x-ui-integration-identity-authtoken');    
    if(session_token){
      req.session.session_token = session_token;
    }
    next();
  };
};