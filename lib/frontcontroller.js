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
 * 
 */

module.exports = function (resmgr, compcontainer) {
    if (!resmgr || !compcontainer) { throw new Error('dependencies missing'); }
    var mod_path              = require('path')
        , Resource              = require('./resources.js').Resource
        , mod_resourcemanager   = resmgr
        , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , componentcontainer    = compcontainer
        , RAIN_INSTANCE_PARAM   = 'rain.instanceid'
        , MAX_RESPONSE_TIME     = 3000
        , mod_fs                = require('fs')
        , mod_tagfactory		= require("./tagparsing/tagfactory.js")
        , tagfactory			= new mod_tagfactory.TagFactory(compcontainer);

    function handleControllerRequest (req, res, next) {
        logger.info('handleControllerRequest ' + req.url);
        handleRequest('handleControllerRequest', req, res);
    }

    function handleViewRequest (req, res, next) {
        logger.info('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);
        handleRequest('handleViewRequest', req, res, tagfactory);
    }

    function handleRequest(handler, req, res, tagfactory) {
        if (!handler) { throw new Error('handler not found'); return; }
        (function (res) {
        	if(tagfactory) {
        		componentcontainer[handler](req, res, tagfactory);
        	}
        	else {
        		componentcontainer[handler](req, res);
        	}
            setTimeout(function () {
                if (!res.finished) {
                    res.writeHead(404, { 'Content-Type' : 'text/plain; charset=UTF-8'} );
                    res.end('timeout');
                }
            }, MAX_RESPONSE_TIME);
        })(res);
    }
    
    function handleResourceNotFound(req, res, next){
      res.statusCode = 404;
      var accept = req.headers.accept || '';
      if (~accept.indexOf('html')) {
        mod_fs.readFile(Server.root + '/public/style.css', 'utf8', function(e, style){
          mod_fs.readFile(Server.root + '/public/resource_not_found.html', 'utf8', function(e, html){
            html = html
              .replace('{style}', style)
              .replace(/\{url\}/g, req.url)
              .replace(/\{statusCode\}/g, res.statusCode);
            res.writeHead(res.statusCode, { 'Content-Type': 'text/html; charset=UTF-8', 'Content-Length' : html.length });
            res.end(html);
          });
        });
      // json
      } else if (~accept.indexOf('json')) {
        var json = JSON.stringify({
          error: {
            url : req.url,
            status : res.statusCode,
            message : "Resource not found"
          }
        });
        res.writeHead(res.statusCode, { 'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': json.length });
        res.end(json);
      // plain text
      } else {
        var plain = "Resource not found";
        res.writeHead(res.statusCode, { 'Content-Type': 'text/plain; charset=UTF-8', 'Content-Length' : plain.length });
        res.end(plain);
      }
    }

    return { 
        'handleControllerRequest'   : handleControllerRequest
        , 'handleViewRequest'       : handleViewRequest
        , 'handleResourceNotFound'       : handleResourceNotFound
    }
}
