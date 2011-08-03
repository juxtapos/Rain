/**
 * Everything is a resource.
 *
 * Todos:
 * * Resources should be sealed and/or frozen after loading (state 'complete') 
 * 
 * @type {String}
 * @api public
 */

var logger          = require('./logger.js').getLogger('Resource')
    , mod_util      = require('util')
    , mod_events    = require('events')
    , mod_http      = require('http')
    , mod_promise   = require('promised-io')
    , mod_fs        = require('fs')
    , mod_url       = require('url')
    ,c              = console.log

function uuid() {
    return new Date().getTime() + '-' + Math.round(Math.random()*10000);
}

/**
 * 
 * @class Base resource class
 * @param {String} URL of resource
 * @param {String} resource payload 
 */
function Resource(url, data) {
    this.type = 'Resource'
    this._uuid = uuid();
    this._state = Resource.STATE.INIT;
    this.url = url;
    if (typeof data !== 'undefined') {
        this.data = new Buffer(data);
        this._state = Resource.STATE.READY;
    } else {
        this.data = null;        
    }
    
    this.uuid = uuid();
};
mod_util.inherits(Resource, mod_events.EventEmitter);

Object.defineProperty(Resource.prototype, 'state', {
    get : function () {
        return this._state;
    },
    set : function (val) {
        if ('number' !== typeof val) throw Error('number expected, got ' + val);
        if (val !== this._state) {
            this._state = val;
            this.emit('stateChanged', this);
        }
    }
});

/**
 * Add a resource as a dependency to this resource. 
 * 
 * @param {Resource} res
 */
Resource.prototype.addDependency = function (res) {
    this._requiredResources[res.uuid] = res;
    var self = this;
    res.addListener('stateChanged', function () { 
        //logger.debug('state changed from sub ' + this.uuid);
        self._onDepStateChange.call(self, res);
    });
};

Resource.prototype._onDepStateChange = function (resource) {
    //logger.debug('_onDepStateChange from ' + resource.uuid + '@' + this.uuid);
    var state = Resource.STATE.READY;
    for (rn in this._requiredResources) {
        state = Math.min(this._requiredResources[rn].state, state);
    }
    this.state = state;
};

/**
 * Must be implemented by subclasses.
 */
Resource.prototype.load = function (url) {
    if ('undefined' === typeof url) {
        throw new Error('url missing');
    }
    if (url.indexOf('http://') === 0) { 
        httpload.call(this, url);
    } else if (url.indexOf('file://') === 0) {
        fileload.call(this, url);
    } 
}

/**
 * Must be implemented by subclasses.
 */
Resource.prototype.render = function () {
    throw new Error('not implemented');
}

Resource.STATE = {
    INIT        : 0
    , LOADING     : 2
    , WAITING     : 4
    , READY       : 6
};





/**
 * 
 * @private
 */
fileload = function (file) {
    if ('undefined' === typeof file || file.indexOf('file://') !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    this.url = file;
    this.state = Resource.STATE.LOADING;
    var self = this,
        file = file.substring(7);
    mod_fs.readFile(file, function (err, data) {
        if (err) { throw err; }
        self.data = data;
        self.state = Resource.STATE.READY;
    });
};

/**
 * 
 * @private
 */
httpload =  function (url) {
    if ('undefined' === typeof url || url.indexOf('http://') !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    var self = this,
        req;
    this.url = url;
    this.state = Resource.STATE.LOADING;
    this.content = '';
    this._options = mod_url.parse(url);
    
    req = mod_http.get(this._options, function (res) {
        if (res.statusCode >= 400 && res.statusCode <= 500) {
            throw new Error('URL could not be loaded, code ' + res.statusCode 
                + ', url ' + self._options.host + ':' + self._options.port + self._options.path);
        }
        res.on('data', function (data) {
            self.data = data;
        });        
        res.on('end', function () {
            self.state = Resource.STATE.READY;
        });
    });
};

/**
 * 
 * @class RenderedViewResource
 * @param {String} url http URL of view template resource
 * @param {Buffer} data
 * @param {String[]} cssdeps 
 * @param {String[]} scriptdeps
 * @param {String[]} localdeps
 */
function RenderedViewResource(url, data, elements, cssdeps, scriptdeps, localedeps) {
    Resource.call(this, url, data);
    this.type = 'RenderedViewResource'
    this.elements = elements;
    this.cssdeps = cssdeps;
    this.scriptdeps = scriptdeps;
    this.localedeps = localedeps;
}
mod_util.inherits(RenderedViewResource, Resource);

RenderedViewResource.prototype.toString = function () {
    return this.url + ',' + this.cssdeps + '' + this.scriptdeps + ',' + this.localedeps;
}

RenderedViewResource.prototype.render = function () {
    
}

function ViewTemplateResource(url, data) {
    Resource.call(this, url, data);
    this.type = 'ViewTemplateResource';
    this.isParsed = false;
    this.deps = {};
}
mod_util.inherits(ViewTemplateResource, Resource);

ViewTemplateResource.prototype.parse = function (parser, tagmanager, resourcemanager, callback) {
    c('ViewTemplateResource.parse');
    var self = this;
    parser(this, tagmanager).then(function (result) {
        self.elements = result.elements;

        var deps = self.elements.map(function (item) {
            var p = 'file://' + require('path').join(__dirname, '..', '/modules/', item.moduleId + '/htdocs/main.html');
            c('add sub-view ' + p);
            return resourcemanager.getResource(p);
        });
        mod_promise.all(deps).then(function (all) {
            all.forEach(function (r) {
                self.deps[r.url] = r;
            });
            //callback.parsed(self);
            callback();
        });
        
        self.cssdeps = result.cssdeps;
        self.scriptdeps = result.scriptdeps;
        self.localedeps = result.localedeps;
        
        self.isParsed = true;
    });
}

ViewTemplateResource.prototype.render = function (callback) {
    c('ViewTemplateResource.render');
    var self = this;
    if (!this.isParsed) { 
        c('not parsed yet');
        return; 
    }
    //c('c ' + this.elements.length)
    
    c(this.elements);
    callback.rendered(this);
}

function CssResource(url, data, elements, cssdeps) {
    Resource.call(this, url, data);
}
mod_util.inherits(CssResource, Resource);

CssResource.prototype.render = function () {
    
}

exports.Resource             = Resource
exports.RenderedViewResource = RenderedViewResource;
exports.ViewTemplateResource = ViewTemplateResource;
exports.CssResource = CssResource;