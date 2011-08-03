/**
 * Caching module. Works in-node-memory (simple JavaScript object) and with redis. 
 *
 * @type {String}
 * @api public
 */

var mod_promise         = require('promised-io')
    , mod_resources     = require('./resources.js')
    , mod_redback       = null
    , redbackClient     = null
    , config            = null
    , mod_logger        = require('./logger.js')
    , logger            = mod_logger.getLogger('Cache', mod_logger.Logger.SEVERITY.INFO)
    , cache             = null 
    , memcache          = {}

const REDIS_CACHE_NAME = 'rain';

function configure(c) {
    config = c;
    if (c && c.caching && c.caching.resources) {
        logger.debug('activate caching');
        mod_redback = require('redback');
        redbackClient = mod_redback.createClient();
        cache = redbackClient.createCache(REDIS_CACHE_NAME);
    }
}

function toCache(url, data) {
    if (cache) {
        toMemcache(url, data);
        logger.debug('write to cache; url: ' + url);
        // [TBD] error handling
        cache.set(url, data, config.caching.ttl, function () {
            logger.debug('written to cache');
        });
    }
}

function fromMemcache(url) {
    var i = memcache[url];
    if (i) {
        logger.debug('in memcache ' + i.created);
        if (i.created + config.caching.ttl * 1000 < new Date().getTime()) {
            logger.debug('expired');
            return null;
        } else {
            return memcache[url].data;
        }
    } else {
        return null;
    }
}

function toMemcache(url, data) {
    logger.debug('to mem ' + url);
    memcache[url] = {
        data : data
        , url : url
        , created : new Date().getTime()
    }
}

function fromCache(url) {
    var defer = mod_promise.defer()
        , cr

    if (cache) {
        if ( (i = fromMemcache(url) ) ) {
            logger.debug('got from mem cache; url: ' + url);
            cr = new mod_resources.Resource(url, i);
            defer.resolve(cr);
            return defer.promise;
            
        }
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
    return defer.promise;
}

exports.fromCache   = fromCache;
exports.toCache     = toCache;
exports.configure   = configure;