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
        , resource = fromCache(url) || (url.indexOf('http://') === 0 
            ? loadFromHttp(url) : url.indexOf('file://') === 0 
                ? loadFromFile(url) : loadFromFile(translatePathToFileUrl(url)))
                .then(function (resource) {
                    if (cache) { toCache(url, resource.data); };
                    defer.resolve(resource);
                });
    return defer;
}

function toCache(url, data) {
    if (cache) {
        cache.add(url, data);
    }
}

function fromCache(url) {
    // var defer = mod_promise.defer();
    // if (cache) {
    //     cache.get(url, function (err, value) {
    //         if (err) {
    //             throw new Error(err);
    //         } else {
    //             defer.resolve(value);
    //         }  
    //     });
    // } else {
    //     defer.resolve(null);
    // }
    // return defer;
    return null;
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