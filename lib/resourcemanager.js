var resources           = require('./resources.js')
    , mod_events        = require('events')
    , mod_resources     = require('./resources.js')
    , mod_promise       = require('promised-io')
    , mod_sys           = require('sys')
    , logger            = require('./logger.js').getLogger('ResourceManager')
    , config            = null
    , cache             = null

/**

Resource Resolution 

Define schemes and transitions: 

External HTTP URLs --> Routed URLS --> Module-internal URLs --> File system URLs; vice versa

Module-specific URIs, e.g. module://weather;1.0.1 maps to [determined by global web component broker]

Need clear borders between sub-components for all URL schemes

*/

function configure(c, ch) {
    config = c;
    cache = ch;
}

/**
 * Convenience array style version of getResource 
 */
function getResources(urls) {
    var defer = mod_promise.defer();
    var self = this;
    var u = 
    mod_promise.all(urls.map(function (item) {
                        return self.getResource(item);
                    }))
                    .then(function (all) {
                        defer.resolve(all);
                    });
    return defer.promise;
}

/**
 * Loads a resource from either a file://, http:// or relative path [LATER]
 *
 * Public API
 *
 * @param url file:// or http:// URL
 * @return promise 
 */
function getResource (url) {
    var defer = mod_promise.defer();
    loadUrl(url).then(function (res) {
        defer.resolve(res);
    });
    return defer.promise;
}

function loadUrl(url) {
    var defer = mod_promise.defer()
        , type = null
        , resource = null

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
    throw new Error('dont use yet!');
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

exports.getResources = getResources;
exports.getResource = getResource;
exports.configure   = configure;