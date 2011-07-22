var resources = require('./resources.js'),
    sys = require('sys'),
    events = require('events'),
    util = require('util'),
    ResourceResolver = require('./resolver.js').ResourceResolver,
    pornutils = require('./pornutils.js'),
    logger = pornutils.getLogger('ResourceManager');

var ResourceManager = exports.ResourceManager = (function () {

    // All resources managed by the ResourceManager, accessible by resource URL.
    this._resources = {};

    // The root resource has dependencies to all managed resources.
    // Used for tracking resource states. 
    this._rootResource = null;

    // Uses the lifecycle states of Resources.
    this._state = 0;

    function Rm() {
        _rootResource = new resources.Resource();
        var self = this;
        _rootResource.addListener('stateChanged', function (resource) {
            self._onStateChange(resource);
        });
    }
    util.inherits(Rm, events.EventEmitter);

    Rm.prototype._onStateChange = function (resource) {
        if (_state !== _rootResource.state) {
            _state = _rootResource.state;
            this.emit('stateChanged', _state);
        }
    }

    Rm.prototype.getResourceByProtocol = function (url) {
        if ('undefined' === typeof url) { return null; }
        var r, rtype; 

        rtype = url.indexOf('http://') === 0 ? 'HttpResource' : 'FileResource';
        r = this.getResourceByUrl(rtype, url);

        return r;
    }

    Rm.prototype.getResourceByUrl = function (type, url) {
        var resource; 
        if ('undefined' === typeof type) { throw new Error('type expected'); }
        if ('undefined' === typeof url) { throw new Error('URL expected'); }
        
        resource = _resources[url];
        
        if ('undefined' !== typeof resource) {
            logger.debug('get resource from cache ' + url);

            return resource;
        } else {

            return this._loadResource(type, url);
        }
    }

    Rm.prototype._loadResource = function (type, url) {
        logger.debug('load from ' + url);
        if ('undefined' === typeof type) { throw new Error('type expected'); }
        if ('undefined' === typeof url) { throw new Error('URL expected'); }
        var resource;
        switch (type) {
            case 'HttpResource' :
                resource = new resources.HttpResource();
                break;
            case 'FileResource' :  
                resource = new resources.FileResource();
                break;
            case 'ModuleResource' :
                resource = new resources.ModuleResource();
                break;
            case 'Resource' : 
                resource = new resources.Resource();
                break;
            default : 
                throw new Error('resource type not found for url ' + url);    
        }
        resource.load(url);
        _resources[url] = resource;
        _rootResource.addDependency(resource);
        
        return resource;      
    }

    Rm.prototype.appendResolver = function (resolver) {
        ResourceResolver.appendResolver(resolver);
    }

    /**
     * For the supplied calls the ResourceResolver until the best match is 
     * found.
     */
    Rm.prototype.getResource = function (url) {
        logger.debug('getResource ' + url);
        var lasturl = url,
            r = function r(u) {
                var res = ResourceResolver.resolve(u);
                logger.debug('resurl ' + res+ ','+u);
                if (res !== null && res !== u) {
                    r(res);
                }   
                if (null !== res) { 
                   lasturl = res; 
                }
            };
        r(url);

        resurl = lasturl;

        //logger.debug('resurl ' + resurl);

        // [TBD] you don't wanna do that... but it's fast...
        /*if (resurl != null && resurl.indexOf('handler://') === 0) {
            logger.debug(resurl.substring(10));
            return global.ClassManager.getClass(resurl.substring(10));
        }*/
        return resurl;
    }


    return new Rm();

})();

exports.ResourceManager = ResourceManager;