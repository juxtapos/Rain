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
 * Caching module. Works in-node-memory (simple JavaScript object) and with redis. 
 * 
 * [TBD] This thing behaves strangely... 
 *
 * @type {String}
 * @api public
 */

var mod_promise         = require('promised-io/promise')
    , mod_resources     = require('./resources.js')
    , mod_redback       = null
    , redbackClient     = null
    , config            = null
    , mod_logger        = require('./logger.js')
    , logger            = mod_logger.getLogger('Cache', mod_logger.Logger.SEVERITY.INFO)
    , cache             = null 
    , memcache          = {}

var REDIS_CACHE_NAME = 'rain';

function configure(c) {
    config = c;
    if (c && c.caching && c.caching.resources) {
        logger.debug('activate caching');
        // mod_redback = require('redback');
        // redbackClient = mod_redback.createClient();
        // cache = redbackClient.createCache(REDIS_CACHE_NAME);
        cache = true;
    }
}

function toCache(url, data) {
    if (cache) {
        toMemcache(url, data);
        logger.debug('write to cache; url: ' + url);
        // [TBD] error handling
        // cache.set(url, data, config.caching.ttl, function () {
        //     logger.debug('written to cache');
        // });
    }
}

function fromMemcache(url) {
    var i = memcache[url];
    if (i) {
        logger.debug('in memcache ' + i.created);
        if (i.created + config.caching.ttl * 1000 < new Date().getTime()) {
            logger.debug('expired');
            return null;
        } else {
            return memcache[url].data;
        }
    } else {
        return null;
    }
}

function toMemcache(url, data) {
    logger.debug('to mem ' + url);
    memcache[url] = {
        data : data
        , url : url
        , created : new Date().getTime()
    }
}

function fromCache(url) {
    var defer = mod_promise.defer()
        , cr

    if (cache) {
        if ( (i = fromMemcache(url) ) ) {
            logger.debug('got from mem cache; url: ' + url);
            //cr = new mod_resources.Resource(url, i);
            defer.resolve(i); 
            return defer.promise;
            
        }
        // cache.exists(url, function (err, exists) {
        //     // [TBD] error handling
        //     if (err) {
        //         throw new Error(err.toString());
        //         defer.resolve(null);
        //     }
        //     if (exists) {
        //         cache.get(url, function (err, value) {
        //             if (err) {
        //                 throw new Error(err);
        //             } else {
        //                 logger.debug('got from cache; url: ' + url);
        //                 cr = new mod_resources.Resource(url, value);
        //                 defer.resolve(cr);
        //             }  
        //         });
        //     } else {
        //         logger.debug('not found in cache; url: ' + url);
        //         defer.resolve(null);
        //     }
        // });
    } else {
        defer.resolve(null);
    }
    return defer.promise;
}

exports.fromCache   = fromCache;
exports.toCache     = toCache;
exports.configure   = configure;