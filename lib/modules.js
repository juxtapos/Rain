/**
 *
 * @type {String}
 * @api public
 */

module.exports = function (tagmgr, resmgr) {
    if (!tagmgr || !resmgr) { throw new Error('dependencies missing'); }
    var mod_sys                 = require('sys')
        , mod_path              = require('path')
        , mod_fs                = require('fs')
        , mod_promise           = require('promised-io')
        , mod_jsdom             = require('jsdom')
        , mod_url               = require('url')
        , mod_querystring       = require('querystring')
        , mod_renderer          = require('./renderer.js')(resmgr)
        , mod_resourcemanager   = resmgr
        , tagmanager            = tagmgr
        , moduleRootFolder      = mod_path.join(__dirname, '..', 'modules')
        , logger                = require('./logger.js').getLogger('Modules')

    function handleControllerRequest (req, res, next) {
        logger.debug('handleControllerRequest ' + req.url);
        var modulename = req.params[0]
            , method = req.params[1]
            , mp = mod_path.join(moduleRootFolder, 'modules', modulename, 'main.js')

        mod_path.exists(mp, function (exists) {
            if (exists) {
                var module = require(mp);
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
            , mp = 'file://' + mod_path.join(moduleRootFolder, modulename, 'htdocs', path);
        logger.debug('handleScriptRequest ' + mp);
        res.setHeader('Content-Type', 'text/javascript');
        mod_resourcemanager.getResource(mp).then(function (resource) {
            res.end(resource.data.toString());
        });
    }

    function handleViewRequest (req, res, next) {
        var query = mod_querystring.parse(mod_url.parse(req.url).query)
            , mode = query.type
            , baseurl = req.url.substring(0, req.url.lastIndexOf('/'))
            , modulename = req.params[0]
            , viewname = req.params[1]
        logger.debug('handleViewRequest, module: ' + req.params[0] + ', view: ' + req.params[1]);

        //
        // [TBD] Fix circular dependencies. Renderer actually needs a back-reference to this module, not a new instance. 
        // [TBD] [TBD]
        var r = new mod_renderer.Renderer(module.exports(tagmanager, mod_resourcemanager), tagmanager);
        console.time('render')
        r.render(getViewUrl(modulename, viewname), mode).then(function (doc) {
            console.timeEnd('render');
            res.end(doc);
            
        });
    }


    const DEFAULT_VIEW = 'main.html';
    /**
     * Gets an absolute file URL of a module. 
     * 
     * @param {String} moduleId unique module id
     * @param {String} viewname view name, may be a partial path
     * @return {String}
     */ 
    function getViewUrl(moduleid, viewname) {
        return 'file://' + require('path')
                .join(__dirname
                        , '..'
                        , 'modules'
                        , moduleid
                        , 'htdocs'
                        , viewname ? viewname : DEFAULT_VIEW
                );
    }   

    // [TBD] will ask the module factory
    function getModule (modulename) {
        return true;
    }

    return { 
        'handleControllerRequest'   : handleControllerRequest
        , 'handleScriptRequest'     : handleScriptRequest
        , 'handleViewRequest'       : handleViewRequest
        , 'getViewUrl'              : getViewUrl
        , 'getModule'               : getModule
    }
}