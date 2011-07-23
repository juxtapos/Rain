var logger          = require('./logger.js').getLogger('Resource')
    , mod_util      = require('util')
    , mod_events    = require('events')
    , mod_http      = require('http')
    , mod_fs        = require('fs')
    , mod_url       = require('url')

function uuid() {
    return new Date().getTime() + '-' + Math.round(Math.random()*10000);
}

function Resource() {
    this._state = Resource.STATE.INIT;
    this._data = '';
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

Resource.prototype.load = function (type) {
    throw new Error('not implemented');
}

Resource.STATE = {
    INIT        : 0
    , LOADING     : 2
    , WAITING     : 4
    , READY       : 6
};

exports.Resource = Resource;





function FileResource() {
    Resource.apply(this, arguments);
}
mod_util.inherits(FileResource, Resource);

FileResource.prototype.load = function (file) {
    if ('undefined' === typeof file || file.indexOf('file://') !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    this.state = Resource.STATE.LOADING;
    var self = this,
        file = file.substring(7);
    mod_fs.readFile(file, function (err, data) {
        if (err) { throw err; }
        self.data = data;
        self.state = Resource.STATE.READY;
    });
};

function HttpResource() {
    Resource.apply(this);
}
mod_util.inherits(HttpResource, Resource);

HttpResource.prototype.load =  function (url) {
    if ('undefined' === typeof url || url.indexOf('http://') !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    var self = this,
        req;
    this.state = Resource.STATE.LOADING;
    this.content = '';
    this._options = mod_url.parse(url);
    
    req = mod_http.get(this._options, function (res) {
        console.log(res.statusCode)
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

exports.FileResource = FileResource;
exports.HttpResource = HttpResource;