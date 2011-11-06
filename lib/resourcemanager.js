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
 * The ResourceManager is the central place where resources in Rain are created and requested. 
 * If caching is enabled, the Resource Manager takes care of caching. 
 */

module.exports = function (c, ch) { 
    if (!c  || !ch) { throw new Error('dependencies missing'); }
    var resources         = require('./resources.js'),
        mod_events        = require('events'),
        mod_resources     = require('./resources.js'),
        mod_promise       = require('promised-io/promise'),
        mod_path          = require('path'),
        mod_sys           = require('sys'),
        logger            = require('./logger.js').getLogger(mod_path.basename(module.filename)),
        config            = c,
        cache             = ch,
        c                 = console.log;

    // we are in ./lib, document root is always one up
    var documentRoot      = config.server.serverRoot;

    /**
     * Convenience array style version of getResource.
     * 
     * @param {String[]} urls URL to resource
     * @return {Promise} Promise, is resolved once all resources are loaded
     * @public
     */
    function getResources(urls) {
        var defer = mod_promise.defer();
        var self = this;
        mod_promise.all(urls.map(function (item) {
                            return self.getResource(item);
                        }))
                        .then(function (all) {
                            defer.resolve(all);
                        });
        return defer.promise;
    }

    /**
     * Loads a resource from either a file://, http:// or relative path. 
     *
     * @param {String} url file:// or http:// URL
     * @return {Promise} Promise, is resolved when resource is ready
     * @public
     */
    function getResource (url) {
        var defer = mod_promise.defer();
        var resource = getResourceByUrl(url);
        resource.load();
        if (resource.state <= mod_resources.Resource.STATES.LOADED) {
            resource.once('complete', function () { 
                defer.resolve(resource);
            });
        } else {
            defer.resolve(resource);
        }

        return defer.promise;
    }

    /**
     * Gets the resource assiocated to a URL. If the cache is enabled and the resource is found in it, 
     * it is returned, otherwise a new resource created.   
     *
     * @param {String} uorl resource URL
     * @return {Resource} Resource instance 
     * @public
     */
    function getResourceByUrl (url, target) {               
        if (typeof __cache !== 'undefined' && __cache[url]) {
            return __cache[url];
        } else {        
            var r = getByUrl(url, target);
            if (typeof __cache !== 'undefined') __cache[url] = r;
            return r;
        }
    }

    /**
     * Gets the resource assiocated to a URL. 
     * This is an internal function, that does not use the cache. Clients should use getResourceByUrl().
     * 
     * @param {String} uorl resource URL
     * @return {Resource} Resource instance 
     */
    function getByUrl (ourl) {
        var resource  = null,
            // the toLowerCase() hack was added due to some strange issue on OS X with an case-insensitive file system
            url = ourl/*.toLowerCase();*/ 

        if (url.indexOf('http://') === -1 && url.indexOf('file://') === -1) {
            url = translatePathToFileUrl(url);
        }

        resource = new mod_resources.Resource(url);
       
        return resource;
    }

    /**
     * Map a standard file path to a absolute file:// URL. Paths are always assumed relative to an
     * installation root folder. This function is only secure in that it prevents paths from leaking
     * outside the Rain project folder. 
     * 
     * @param {String} path file path
     * @param {String} an absolute file:// URL
     * @public 
     */
    function translatePathToFileUrl (path) {
        // prevents leaking above the document root
        var cleanpath = mod_path.join(path);
        var p = 'file://'+ mod_path.join(documentRoot, cleanpath);
        return p;
    }

    return {
        'getResources'              : getResources,
        'getResource'               : getResource,
        'translatePathToFileUrl'    : translatePathToFileUrl,
        'getResourceByUrl'          : getResourceByUrl
    }
};