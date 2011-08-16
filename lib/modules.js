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
        , modulecontainer       = require('./modulecontainer.js')
        , RAIN_INSTANCE_PARAM   = 'rain.instanceid'
        , c = console.log;

    function handleControllerRequest (req, res, next) {
        logger.info('handleControllerRequest ' + req.url);
        var modulename = req.params[0]
            , controller = req.params[1]
            , method = req.method.toLowerCase()
            , mp = mod_path.join(modulecontainer.moduleRootPath, modulename, 'controller', 'js', controller);
        mod_path.exists(mp, function (exists) {
            if (exists) {
                var module = require(mp);
                //c(module);
                //logger.debug(module+','+method);
                if (module[method]) {
                    module[method](req, res);
                    res.end('');
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

    

    function handleViewRequest (req, res, next) {
        var query = mod_querystring.parse(mod_url.parse(req.url).query)
            , mode = query.type
            , modulename = req.params[0]
            , viewname = req.params[1]
            , resource;
        logger.info('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);
        console.time('render');
        resource = mod_resourcemanager.loadResourceByUrl(modulecontainer.getModuleFolderFilePath(modulename, tagmanager) + 'htdocs/' + viewname);

        // var module = modulecontainer.getModuleFromPath('/modules/' + modulename);

        // if (!module) {
        //     throw new Error('zhit');
        // }

        var modulepath = '/modules/' + modulename

        var renderer = new Renderer(resource, modulepath, parser, tagmanager, mod_resourcemanager);
        if (query[RAIN_INSTANCE_PARAM]) {
            logger.debug('requiring instance per request parameter');
            if (query[RAIN_INSTANCE_PARAM] instanceof Array) {
                query[RAIN_INSTANCE_PARAM].forEach(function (iid) { addInstance(iid, resource, renderer); });
            } else {
                addInstance(query[RAIN_INSTANCE_PARAM], resource, renderer);
            }
        }
        renderer.render();
        renderer.addListener('stateChanged', function (renderer) {
            if (renderer.state == Renderer.STATES.COMPLETE) {
                console.timeEnd('render');
                res.end(renderer.renderResult);
            }
        });

        function addInstance (id, resource, renderer) {
            var dataurl = 'file://' + mod_path.join(__dirname, '..', 'instances', id);
            var instanceresource = mod_resourcemanager.loadResourceByUrl(dataurl);
            instanceresource.load();
            resource.addDependency(instanceresource);
            renderer.instanceResources[id] = instanceresource;
        }
    }

    function handleResourceRequest (req, res, next) {

        var modulename = req.params[0]
            , path = req.params[1]
            , mp = 'file://' + mod_path.join(modulecontainer.moduleRootPath, modulename, 'htdocs', path);
        
        logger.debug('handleScriptRequest, module:' + modulename + ',mp:' + mp);

        logger.debug('handleScriptRequest ' + mp);
        res.setHeader('Content-Type', 'application/javascript');
        mod_resourcemanager.getResource(mp).then(function (resource) {
            res.end(resource.data.toString());
        });
    }

    return { 
        'handleControllerRequest'   : handleControllerRequest
        , 'handleViewRequest'       : handleViewRequest
        , 'handleResourceRequest'   : handleResourceRequest
    }
}