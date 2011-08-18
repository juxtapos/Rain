"use strict";

/**
 * 
 */

module.exports = function (tagmgr, resmgr, modcontainer) {
    if (!tagmgr || !resmgr) { throw new Error('dependencies missing'); }
    var mod_sys                 = require('sys')
        , mod_path              = require('path')
        , mod_fs                = require('fs')
        , mod_promise           = require('promised-io/lib/promise')
        , mod_url               = require('url')
        , mod_querystring       = require('querystring')
        , mod_resourcemanager   = resmgr
        , tagmanager            = tagmgr
        , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , Renderer              = require('./renderer.js')(modcontainer).Renderer
        , parser                = require('./parser.js').parseHtmlView
        , modulecontainer       = modcontainer
        , RAIN_INSTANCE_PARAM   = 'rain.instanceid'
        , ins = mod_sys.inspect
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
        console.time('render');
        var query           = mod_querystring.parse(mod_url.parse(req.url).query)
            , outputMode    = query['rain.output']
            , modulename    = req.params[0]
            , viewname      = req.params[1]
            , module                        // component config object associated to request
            , resource;                     // view template resource of requested view
        
        logger.info('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);
        
        if (outputMode) outputMode = outputMode.toLowerCase();
        logger.debug('outputMode ' + outputMode);

        module = modulecontainer.resolveFromRequestPath('/modules/' + modulename);
        logger.debug('module ' + ins(module));
        if (!module) { res.end('module not found'); return; }

        resource = mod_resourcemanager.loadResourceByUrl(modulecontainer.getModuleFolderFilePath(module, tagmanager) + 'htdocs/' + viewname);
        logger.debug('view resource ' + resource.url);
        
        var renderer = new Renderer(resource, module, parser, tagmanager, mod_resourcemanager, outputMode);

        var mu = mod_path.join(__dirname, '..', module.url, 'controller', 'js', viewname + '.js');
        if (mod_path.existsSync(mu)) {
            logger.debug('loading server-side controller ' + mu);
            var module = require(mu);    
        }

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

    // only a "static server" for js files
    function handleResourceRequest (req, res, next) {
        var modulename = req.params[0]
            , path = req.params[1]
            , mp = 'file://' + mod_path.join(modulecontainer.moduleRootPath, modulename, 'htdocs', path);
        logger.debug('handleScriptRequest, module:' + modulename + ',mp:' + mp);
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