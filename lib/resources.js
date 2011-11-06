/*
Copyright (c) 2011, Claus Augusti <claus@formatvorlage.de>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

"use strict";

/**
 * Everything is a resource. We love resources. 
 *
 * The Resource class can load a ftp:// or http:// resource and handle dependencies to other 
 * resources. Each resource has a state associated to it, see the Resource.STATES object. 
 * The document addressed by the resource (i.e. its URL) can be loaded with the load() function, 
 * the dependencies are loaded separately by loadDependencies(). 
 * 
 * The resource payload can be accessed using the data property as a string only currently. 
 * 
 * Each resource created by this module gets a unique ID (to the module).
 * 
 * Use the Resource Manager if you require caching.
 * 
 * Todos:
 * * handle HTTP chunks (never saw chunks anyways?)
 * * more robust error handling
 * * HTTP timeout
 */
var c = console.log;
var mod_util        = require('util')
    , mod_events    = require('events')
    , mod_path      = require('path')
    , mod_http      = require('http')
    , mod_fs        = require('fs')
    , mod_url       = require('url')
    , logger        = require('./logger.js').getLogger(mod_path.basename(module.filename), 0);

function createuuid() {
    if (typeof createuuid.cnt === 'undefined') createuuid.cnt = 0;
    return ++createuuid.cnt;
}

/**
 * 
 * @class Base resource class
 * @param {String} URL of resource
 */
function Resource(url) {
    this._state = Resource.STATES.INIT;
    this.requiredResources = {};
    this.uuid = createuuid();
    this.url = url;
    this.data = null;
};
mod_util.inherits(Resource, mod_events.EventEmitter);

Resource.STATES = {
    INIT          : 0
    , LOADING     : 2 
    , LOADED      : 3
    , COMPLETE    : 20
};

/**
 * States are central to the Resource class. See the Resource.STATES object. 
 */
Object.defineProperty(Resource.prototype, 'state', {
    get : function () {
        return this._state;
    },  
    set : function (val) {
        if ('number' !== typeof val) { throw Error('expected number ' + val); }
        if (val !== this._state) {
            //logger.debug('set ' + this.uuid + ' to ' + val);
            if (val == Resource.STATES.LOADED && this._state < Resource.STATES.COMPLETE && this.dependenciesLoaded()) {
                this._state = Resource.STATES.COMPLETE;
            } else {
                this._state = val;            
            }
            if (this._state == Resource.STATES.COMPLETE) this.emit('complete', this);
            if (this._state == Resource.STATES.LOADED) this.emit('load', this);
            this.emit('stateChanged', this);
        }
    }
});

/**
 * Add a resource reference as a dependency (and does nothing else). 
 * Call loadDependencies() to load dependencies explicitly.
 * Currently, dependencies may not be added after a resource has entered the LOADINGDEPS state. 
 * 
 * @param {Resource} resource
 */
Resource.prototype.addDependency = function (resource) {
    logger.debug('addDependency ' + resource.uuid + ' to ' + this.uuid);
    var self = this;
    if (!(resource instanceof Resource)) { throw new Error('wrong type'); }
    if (typeof this.requiredResources[resource.uuid] !== 'undefined') { throw new Error('resource uuid not unique. how the fuck did that happen?'); }
    this.requiredResources[resource.uuid] = resource;
    resource.addListener('stateChanged', function (event) { self.handleDepEvent(event); });
};

/**
 * Start loading the dependencies that were before added via addDependency.
 * 
 */
Resource.prototype.loadDependencies = function () {
    var self = this, resource;
    if (this.dependenciesLoading) { return };
    for (var uuid in this.requiredResources) {
        resource = this.requiredResources[uuid];
        resource.load();
    }
    this.dependenciesLoading = true;
}

/**
 * Handles the state change of a dependent resource that is being loaded. Sets the state to 
 * Resource.STATES.COMPLETE when all dependencies and the resource itself are loaded. 
 */
Resource.prototype.handleDepEvent = function (resource) {
    var self = this;
    logger.debug('dependency ' + resource.uuid + '('+  resource.url + ') of ' + this.uuid + ' changed state to ' + resource.state);
    if (self.state >= Resource.STATES.LOADED && this.dependenciesLoaded()) {
        this.state = Resource.STATES.COMPLETE;
    }
}

/**
 * @return {Boolean} True, if all dependencies are loaded (or if this instance has no dependencies).
 */
Resource.prototype.dependenciesLoaded = function () {
    var uuid;
    for (uuid in this.requiredResources) {
        if (this.requiredResources[uuid].state < Resource.STATES.COMPLETE) {
            return false; 
        }
    }
    return true;
}

/**
 * Loads the file:// or http:// resource the url property points to.
 * The state is set to Resource.STATES.LOADING before loading when to Resource.STATES.LOADED 
 * when complete. 
 */
Resource.prototype.load = function () {
    var self = this;
    if (!this.url) { throw new Error('url not set'); }
    if (this.state >= Resource.STATES.LOADING) { return; }
    this.state = Resource.STATES.LOADING;

    function loaded(data) {
        self.data = data;
        self.state = Resource.STATES.LOADED;
    }

    if (this.url.indexOf('http://') === 0) { 
        Resource.loadByHttp.call(this, loaded);
    } else if (this.url.indexOf('file://') === 0) {
        Resource.loadByFile.call(this, loaded);
    } else {
        throw new Error('only http:// and file:// URLs are supported');
    }

    this.loadDependencies();
}

/**
 * Asynchronously loads a file:// URL and does a callback with the data when complete. 
 * [TBD] chunking!
 * 
 * @param {Function} cb callback function 
 */ 
Resource.loadByFile = function (cb) {
    var fp = 'file://'
        , self = this;
    if (this.url.indexOf(fp) !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    mod_fs.readFile(this.url.substring(fp.length), function (err, data) {
        if (err) { 
            logger.debug('file not found; url:' + self.url + ', err ' + err);
            //this.emit('error'); // why does that end the application? 
            cb('');
            return;
            //throw err; 
        }
        cb(data.toString());
    });
};

/**
 * Asynchronously loads a http:// URL and does a callback  with the data when complete. 
 * 
 * @param {Function} cb callback function 
 */
Resource.loadByHttp = function (cb) {
    if (this.url.indexOf('http://') !== 0) { 
        throw new Error('missing or faulty argument'); 
    }
    var self = this, req;
    this._options = mod_url.parse(this.url);

    if (this._options.host.indexOf(':') > -1) {
        this._options.host = this._options.host.substring(0, this._options.host.indexOf(':'));
    }

    this._options.path = this._options.pathname; // http.get wants it this way
    
    req = mod_http.get(this._options, function (res) {
        var buffer = [];
        if (res.statusCode >= 400 && res.statusCode <= 500) {
            throw new Error('URL could not be loaded, code ' + res.statusCode 
                + ', url ' + self._options.host + ':' + self._options.port + self._options.path);
        }
        res.on('data', function (data) {
            buffer.push(data.toString());
        });        
        res.on('end', function () {
            cb(buffer.join(''));
        });
    });
};

exports.Resource = Resource;