var logger = require('./logger.js').getLogger('Resource')
    , sys = require('sys')
    , util = require('util')
    , events = require('events')
    , http = require('http')
    , fs = require('fs')

function Resource() {
    this.state = Resource.STATES.INIT;
    // [tbd] create nicer uuid
    this.uuid = new Date().getTime() + '-' + Math.round(Math.random()*10000);
};
util.inherits(Resource, events.EventEmitter);

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
    var state = Resource.STATES.READY;
    for (rn in this._requiredResources) {
        state = Math.min(this._requiredResources[rn].state, state);
    }
    this.state = state;
};

Resource.prototype.getRepresentation = function (type) {
    throw new Error('not implemented');
}

Resource.STATES = {
    INIT        : 0,
    LOADING     : 2,
    WAITING     : 4,
    READY       : 6
};

exports.Resource = Resource;





function FileResource() {
    Resource.apply(this, arguments);
}
util.inherits(FileResource, Resource);

FileResource.prototype.load = function (file) {
    if ('undefined' === typeof file) { throw new Error('argument missing'); }
    this.state = Resource.STATES.LOADING;
    var self = this;
    file = file.substring(7);
    // [tbd] the non-chunked version is certainly a better fit for production 
    // systems.
    fs.readFile(file, function (err, data) {
        if (err) { throw err; }
        self.content = data.toString();
        //logger.debug('loaded ' + this.content)
        self.state = Resource.STATES.READY;
    });
};

exports.FileResource = FileResource;





function HttpResource() {
    Resource.apply(this);
}
util.inherits(HttpResource, Resource);

HttpResource.prototype.load =  function (options) {
    if ('undefined' === typeof options) { throw new Error('missing argument'); }
    var self = this,
        options, 
        req;
    this.state = Resource.STATES.LOADING;
    this.content = '';
    o = pornutils.parseUri(options); 
    this._options = { host : o.host, port : o.port, path : o.path };
    req = http.get(this._options, function (res) {
        // [TBD] Poor man's error handling
        if (res.statusCode.toString().indexOf('4') === 0) {
            throw new Error('URL could not be loaded, code ' + res.statusCode 
                + ', url ' + self._options.host + ':' + self._options.port + self._options.path);
        }
        res.on('data', function (data) {
            self.content = data.toString();
        });        
        res.on('end', function () {
            self.state = Resource.STATES.READY;
        });
    });
};

exports.HttpResource = HttpResource;





function HtmlResource() {
    Resource.apply(this);
}
util.inherits(HtmlResource, Resource);

HtmlResource.prototype.load = function (url) {
    if ('string' !== typeof url) { throw new Error('argument missing'); }
    if (0 === url.indexOf('http://')) {
        r = new HttpResource(url);
    } else if (0 === url.indexOf('file://')) {
        r = new FileResource(url);
    }
    this.templateResource = r;
    r.load(url);
    this.addDependency(r);
}

HtmlResource.prototype.getResult = function () {
    return this.templateResource.content;
}

HtmlResource.prototype.getRepresentation = function () {
    
}
exports.HtmlResource = HtmlResource;