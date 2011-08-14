"use strict";

/**
 *
 */

module.exports = function (tagmgr, resmgr) {
    if (!tagmgr || !resmgr) { throw new Error('dependencies missing'); }
    var mod_sys                 = require('sys')
        , mod_path              = require('path')
        , mod_fs                = require('fs')
        , mod_promise           = require('promised-io')
        , mod_url               = require('url')
        , mod_querystring       = require('querystring')
        , mod_resourcemanager   = resmgr
        , tagmanager            = tagmgr
        , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , Renderer              = require('./renderer.js').Renderer
        , parser                = require('./parser.js').parseHtmlView
        , modulecontainer       = require('./modulecontainer.js');

    function handleControllerRequest (req, res, next) {
        logger.debug('handleControllerRequest ' + req.url);
        var modulename = req.params[0]
            , method = req.params[1]
            , mp = mod_path.join(moduleRootFolder, modulename, 'main.js')

        mod_path.exists(mp, function (exists) {
            if (exists) {
                var module = require(mp);
                logger.debug(module)
                if (module[method]) {
                    module[method](req, res).then(function (ret) {
                        res.end(ret.data);
                    });
                } else {
                    res.writeHead(404, { 'Content-Type' : 'text/plain'} );
                    res.end('method not available');
                }   
            } else {
                res.writeHead(404, { 'Content-Type' : 'text/plain'} );
                res.end('unknown module ' + modulename);
            }
        });
    }

    function handleScriptRequest (req, res, next) {
        var modulename = req.params[0]
            , path = req.params[1]
            , mp = 'file://' + mod_path.join(modulecontainer.moduleRootPath, modulename, 'htdocs', path);
        logger.debug('handleScriptRequest ' + mp);
        res.setHeader('Content-Type', 'application/javascript');
        mod_resourcemanager.getResource(mp).then(function (resource) {
            res.end(resource.data.toString());
        });
    }

    function handleViewRequest (req, res, next) {
        var query = mod_querystring.parse(mod_url.parse(req.url).query)
            , mode = query.type
            , modulename = req.params[0]
            , viewname = req.params[1]
        logger.debug('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);
        console.time('render');
        var resource = mod_resourcemanager.loadResourceByUrl(modulecontainer.getModuleFolderFilePath(modulename, tagmanager) + 'htdocs/' + viewname);
        var renderer = new Renderer(resource, parser, tagmanager, mod_resourcemanager);
        if (query['rain.instanceid']) {
            logger.debug('requiring instance per request parameter');
            var dataurl = 'file://' + mod_path.join(__dirname, '..', 'instances', query['rain.instanceid']);
            var instanceresource = mod_resourcemanager.loadResourceByUrl(dataurl);
            instanceresource.load();
            resource.addDependency(instanceresource);
            renderer.instanceResources[query['rain.instanceid']] = instanceresource;
        }
        renderer.render();
        renderer.addListener('stateChanged', function (renderer) {
            if (renderer.state == Renderer.STATES.COMPLETE) {
                console.timeEnd('render');
                res.end(renderer.renderResult);
            }
        });
    }

    function getModuleRequestParameters (req) {
        
    }

    return { 
        'handleControllerRequest'   : handleControllerRequest
        , 'handleScriptRequest'     : handleScriptRequest
        , 'handleViewRequest'       : handleViewRequest
    }
}