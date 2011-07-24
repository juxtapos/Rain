var mod_promise         = require('promised-io')
    , mod_resources     = require('./resources.js')
    , mod_redback       = null
    , redbackClient     = null
    , config            = null
    , logger            = require('./logger.js').getLogger('Cache')
    , cache             = null

// var _cache = {};
// var cache = {
//     add : function (key, value, cb) {
//         if (typeof _cache[key] === 'undefined') {
//             _cache[key] = value;
//         }
//         cb();
//     }
//     , get : function (key, cb) {
//         cb(null, _cache[key] ? _cache[key] : null);
//     }
//     , set : function (key, value, exp, cb) {
//         _cache[key] = value;
//         cb();
//     } 
//     ,exists : function (key, cb) { 
//         cb(typeof _cache[key] !== 'undefined');
//     }
// }

function configure(c) {
    config = c;
    if (config && config.caching && config.caching.resources) {
        logger.debug('activate caching');
        mod_redback = require('redback');
        redbackClient = mod_redback.createClient();
        cache = redbackClient.createCache('rain');
    }

}

function toCache(url, data) {
    if (cache) {
        logger.debug('write to cache; url: ' + url);
        // [TBD] error handling
        cache.set(url, data, config.caching.ttl, function () {
            //logger.debug('written to cache');
        });
    }
}

function fromCache(url) {
    var defer = mod_promise.defer()
        , cr

    if (cache) {
        cache.exists(url, function (err, exists) {
            // [TBD] error handling
            if (err) {
                throw new Error(err.toString());
                defer.resolve(null);
            }
            if (exists) {
                cache.get(url, function (err, value) {
                    if (err) {
                        throw new Error(err);
                    } else {
                        logger.debug('got from cache; url: ' + url);
                        cr = new mod_resources.Resource(url, value);
                        defer.resolve(cr);
                    }  
                });
            } else {
                logger.debug('not found in cache; url: ' + url);
                defer.resolve(null);
            }
        });
    } else {
        defer.resolve(null);
    }
    return defer;
}

exports.fromCache   = fromCache;
exports.toCache     = toCache;
exports.configure   = configure;