var resources           = require('./resources.js')
    , mod_events        = require('events')
    , mod_resources     = require('./resources.js')
    , mod_promise       = require('promised-io')
    , mod_sys           = require('sys')
    , logger            = require('./logger.js').getLogger('ResourceManager')
    , config            = null
    , cache             = null

function configure(c, ch) {
    config = c;
    cache = ch;
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
    if (!cache) {
        throw new Error('no cache set up');
    }
    //logger.debug('load url ' +url);
    if (cache) {
        cache.fromCache(url).then(function (resource) {
        if (!resource) {
            resource = getResourceByUrl(url)
                    .then(function (resource) {
                        cache.toCache(url, resource.data);
                        defer.resolve(resource);
                    });
        } else {
            defer.resolve(resource);
        }
        });        
    } else {
        resource = getResourceByUrl(url)
                    .then(function (resource) {
                        defer.resolve(resource);
                    });
    }

    
    return defer.promise;
}

function getResourceByUrl(url) {
    return url.indexOf('http://') === 0 
                ? loadFromHttp(url) : url.indexOf('file://') === 0 
                    ? loadFromFile(url) : loadFromFile(translatePathToFileUrl(url));
}

// [TBD]
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
        
    return defer.promise;
}

function loadFromFile(url) {
    var defer = mod_promise.defer()
        , resource = new mod_resources.FileResource()
    resource.load(url);
    resource.addListener('stateChanged', function () {
        defer.resolve(resource);
    });
    return defer.promise;
}

exports.getResource = getResource;
exports.configure   = configure;