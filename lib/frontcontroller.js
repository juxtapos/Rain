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

module.exports = function (tagmgr, resmgr, modcontainer) {
    if (!tagmgr || !resmgr || !modcontainer) { throw new Error('dependencies missing'); }
    var mod_sys                 = require('sys')
        , mod_path              = require('path')
        , mod_fs                = require('fs')
        , mod_promise           = require('promised-io/lib/promise')
        , mod_url               = require('url')
        , mod_querystring       = require('querystring')
        , Resource              = require('./resources.js').Resource
        , mod_resourcemanager   = resmgr
        , tagmanager            = tagmgr
        , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , Renderer              = require('.//renderer.js')(tagmanager, modcontainer).Renderer
        , parser                = require('./parser.js').parseHtmlView
        , modulecontainer       = modcontainer
        , RAIN_INSTANCE_PARAM   = 'rain.instanceid'
        , MAX_RESPONSE_TIME     = 3000
        , ins = mod_sys.inspect
        , c = console.log;

    function handleControllerRequest (req, res, next) {
        logger.info('handleControllerRequest ' + req.url);    

        (function (res) {            
            modulecontainer.handleControllerRequest(req, res);
            setTimeout(function () {
                if (!res.finished) {
                    res.writeHead(404, { 'Content-Type' : 'text/plain'} );
                    res.end('timeout');   
                }
            }, MAX_RESPONSE_TIME);
        })(res);
    }

    function handleViewRequest (req, res, next) {
        console.time('render');
        var parse         = mod_url.parse(req.url),
            query         = mod_querystring.parse(parse.query),
            outputMode    = (query['rain.output'] || 'html').toLowerCase(),
            modulename    = req.params[0],
            viewname      = req.params[1],
            module,                       // component config object associated to request
            resource,                     // view template resource of requested view
            data          = {},
            key;
 
        logger.info('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);
        for (key in query) {
            data['req_' + key] = query[key]; 
        }
        module = modulecontainer.resolveFromRequestPath(parse.pathname);
        var renderer = new Renderer(parse.pathname, outputMode, null, data);
        renderer.once('stateChanged', function (renderer) {
            if (renderer.state == Renderer.STATES.RENDERED) {
                if (renderer.mode == 'html') {
                    res.setHeader('Content-Type', 'text/html');
                    res.end(renderer.renderresult.content);    
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(renderer.renderresult));
                }
                console.timeEnd('render');
                //Renderer.showTree(render1);
            }
        });

        /*
        if (query[RAIN_INSTANCE_PARAM]) {
            logger.debug('requiring instance per request parameter');
            if (query[RAIN_INSTANCE_PARAM] instanceof Array) {
                query[RAIN_INSTANCE_PARAM].forEach(function (iid) { addInstance(iid, resource, renderer); });
            } else {
                addInstance(query[RAIN_INSTANCE_PARAM], resource, renderer);
            }
        }
        
        function addInstance (id, resource, renderer) {
            var dataurl = 'file://' + mod_path.join(__dirname, '..', 'instances', id);
            var instanceresource = mod_resourcemanager.loadResourceByUrl(dataurl);
            instanceresource.load();
            resource.addDependency(instanceresource);
            renderer.instanceResources[id] = instanceresource;
        }
        */
    }

    return { 
        'handleControllerRequest'   : handleControllerRequest
        , 'handleViewRequest'       : handleViewRequest
    }
}
