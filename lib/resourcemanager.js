var resources           = require('./resources.js')
    , mod_events        = require('events')
    , mod_resources     = require('./resources.js')
    , mod_promise       = require('promised-io')
    , mod_sys           = require('sys')
    , logger            = require('./logger.js').getLogger('ResourceManager')
    , config            = null
    // these are set later if config.caching.resources == true
    , mod_redback       = null
    , redbackClient     = null
    , cache             = null


//
// Super simple in-memory cache. 
// Caching will be refactored later to a dedicated module, mixing process in-memory and redis.  
// 
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
        mod_redback = require('redback');
        redbackClient = mod_redback.createClient();
        cache = redbackClient.createCache('rain');
    }
}

function getResource (url) {
    var defer = mod_promise.defer();
    loadUrl(url).then(function (res) {
        defer.resolve(res);
    });
    return defer;
}

function loadUrl(url) {
    var defer = mod_promise.defer()
        , type = null
        , resource = null;
    logger.debug('load url ' +url);
    fromCache(url).then(function (resource) {
        if (!resource) {
            resource = (url.indexOf('http://') === 0 
                ? loadFromHttp(url) : url.indexOf('file://') === 0 
                    ? loadFromFile(url) : loadFromFile(translatePathToFileUrl(url)))
                    .then(function (resource) {
                        if (cache) { toCache(url, resource.data); };
                        defer.resolve(resource);
                    });
        } else {
            defer.resolve(resource);
        }    
    })

    
    return defer;
}

function toCache(url, data) {
    if (cache) {
        //logger.debug('write to cache; url: ' + url);
        cache.set(url, data, null, function () {});
    }
}

function fromCache(url) {
    var defer = mod_promise.defer()
        , cr

    if (cache) {
        cache.exists(url, function (exists) {
            if (exists) {
                cache.get(url, function (err, value) {
                    if (err) {
                        throw new Error(err);
                    } else {
                        //logger.debug('got from cache; url: ' + url);
                        cr = new mod_resources.Resource(url, value);
                        defer.resolve(cr);
                    }  
                });
            } else {
                //logger.debug('not found in cache; url: ' + url);
                defer.resolve(null);
            }
        });
    } else {
        defer.resolve(null);
    }
    return defer;
}

function translatePathToFileUrl(url) {
    if (url.indexOf('.') === 0) {
    }
    return url;
}

function loadFromHttp(url) {
    var defer = mod_promise.defer()
        , resource = new mod_resources.HttpResource()
    resource.load(url);
    resource.addListener('stateChanged', function () {
        defer.resolve(resource);         
    });  
        
    return defer;
}

function loadFromFile(url) {
    var defer = mod_promise.defer()
        , resource = new mod_resources.FileResource()
    resource.load(url);
    resource.addListener('stateChanged', function () {
        defer.resolve(resource);
    });
    return defer;
}

exports.getResource = getResource;
exports.configure   = configure;