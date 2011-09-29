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
 * Resources are normally not constructed manually but accessed using this module. 
 * If caching is enabled, the Resource Manager takes care of caching. 
 * 
 * Todos:
 * * Resource Resolution 
 * * Define schemes and transitions: 
 * * External HTTP URLs --> Routed URLS --> Module-internal URLs --> File system URLs; vice versa
 * * Module-specific URIs, e.g. module://weather;1.0.1 maps to [determined by global web component broker]
 * * Need clear borders between sub-components for all URL schemes
 */

module.exports = function (c, ch) { 
    if (!c  || !ch) { throw new Error('dependencies missing'); }
    var resources           = require('./resources.js')
        , mod_events        = require('events')
        , mod_resources     = require('./resources.js')
        , mod_promise       = require('promised-io/promise')
        , mod_path          = require('path')
        , mod_sys           = require('sys')
        , logger            = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , config            = c
        , cache             = ch
        , c                 = console.log

    // we are in ./lib, document root is always one up
    var documentRoot      = mod_path.join(__dirname, '..'); 

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
        var resource = loadResourceByUrl(url);
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
     * Gets a resource either from the cache (if enabled) or loads it. 
     * 
     * @param {String} url resource url
     * @param {Promise} Promise, resolves to resource
     * @public
     */
    // function loadUrl(url) {
    //     var defer = mod_promise.defer()
    //         , type = null
    //         , resource = null

    //     if (url.indexOf('http://') === -1 && url.indexOf('file://') === -1) {
    //         url = translatePathToFileUrl(url);
    //     }

    //     if (cache) {
    //         cache.fromCache(url).then(function (resource) {
    //             if (!resource) {
    //                 resource = getResourceByUrl(url)
    //                         .then(function (resource) {
    //                             cache.toCache(url, resource.data);
    //                             defer.resolve(resource);
    //                         });
    //             } else {
    //                 defer.resolve(resource);
    //             }
    //         });        
    //     } else {
    //         resource = getResourceByUrl(url)
    //                     .then(function (resource) {
    //                         defer.resolve(resource);
    //                     });
    //     }

        
    //     return defer.promise;
    // }

    // WARNING: do not switch on caching currently, there's a bug in the renderer module that 
    // apparently does not resolve correctly when a resource was already loaded. 
    //__cache = {};
    function loadResourceByUrl (url, target) {
        var r = getResourceByUrl(url, target);
        r.load();
        return r;
    }

    function getResourceByUrl (url, target) {    	    	
        if (typeof __cache !== 'undefined' && __cache[url]) {        	
            //c('from cache ' + url);
            return __cache[url];
        } else {       	
            var r = getByUrl(url, target);
            //c('put cache ' + url);
            if (typeof __cache !== 'undefined') __cache[url] = r;
            return r;
        }
    } 

    /**
     * Gets the correct resource type assiocated to a URL without querying the cache. 
     * 
     * [TBD] remove
     * 
     * @param {String} url resource URL
     * @param {Promise} promise, resolves to resource instance. 
     * @public
     */
    function getByUrl (ourl, target) {
        var resource  = null,
            // the toLowerCase() hack was added due to some strange issue on OS X with an case-insensitive file system
            url = ourl/*.toLowerCase();*/ 

        if (url.indexOf('http://') === -1 && url.indexOf('file://') === -1) {
            url = translatePathToFileUrl(url);
        }

        // if (url.indexOf('.css') === url.length - 4) {
        //     resource = new mod_resources.CssResource(url);
        // } else if (url.indexOf('.html') === url.length - 5) {
        //     resource = new mod_resources.ViewTemplateResource(url);
        //} else {
            resource = new mod_resources.Resource(url);
        //}
  
        return resource;
    }

    /**
     * Map a standard file path to a absolute file:// URL. Paths are always assumed relative to an
     * installation root folder.
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
        'getResources'              : getResources
        , 'getResource'             : getResource
        , 'loadResourceByUrl'       : loadResourceByUrl
        , 'translatePathToFileUrl'  : translatePathToFileUrl
        , 'getResourceByUrl'        : getResourceByUrl
    }
};