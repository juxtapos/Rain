"use strict";

/**  
 * Module Container, Manager, Factory, whatever. All module related thingz must belong to us. 
 *
 * Todos:
 *
 * * scan the local module folder for web component descriptors as resources. 
 * * download module descriptors from remote web component hosts as resources. 
 * * provide web component objects.  
 * * crud on module instances. 
 * 
 */
module.exports = function (configfile) {
    if (!configfile) { throw new Error('configfile missing'); }
    var mod_fs 					= require('fs')
    	, mod_resourcemanager 	= require('./resourcemanager.js')
    	, mod_path 				= require('path')
        , logger            	= require('./logger.js').getLogger(mod_path.basename(module.filename))
        , mod_sys               = require('sys')
        , moduleRootPath        = mod_path.join(__dirname, '..')
        , config                = mod_fs.readFileSync(mod_path.join(__dirname, '..', 'conf', configfile))
        , moduleMap = JSON.parse(config)
        , c = console.log
        //, DEFAULT_VIEW = 'main.html';
        , COMPONENT_PROTOCOL    = 'webcomponent://';
    
    logger.debug('read module config from ' + mod_path.join(__dirname, '..', 'conf', configfile));

    function getViewUrl (moduleConfig, view, tagmanager) {
        var view = view || 'main';
        var p = getModuleFolderFilePath(moduleConfig, tagmanager); 
        if (moduleConfig.url.indexOf('http://') > -1) {
            return p + '/' + view + '.html'
        } else {
            return p + mod_path.join('htdocs', view + '.html');
        }
    }


    function getModuleFolderFilePath (moduleConfig) {
        logger.debug('getModuleFolderFilePath module ' + module);
        if (moduleConfig.url.indexOf('http://') == 0) {
            return moduleConfig.url;
        } else {
            var path = 'file://' + mod_path.join(moduleRootPath, moduleConfig.url, '/');
            return path;
        }
    }

    function getModulePath (moduleId) {
        var moddesc;
        logger.debug('gmp ' + moduleId);
        if (moduleId.indexOf(COMPONENT_PROTOCOL) == 0) { moduleId = moduleId.substring(COMPONENT_PROTOCOL.length); }
        for (module in moduleMap) {
            if (moduleId.indexOf(';') == -1) {
                var i = module.indexOf(';');
                var m = module.substring(0, i > -1 ? i : module.length);
            } else {
                m = module;
            }
            if (moduleId == m) {
                moddesc = moduleMap[module];
                break;
            }
        }
        if (moddesc) {
            c('module ' + moduleId + "->" + moddesc.url);
            return moddesc.url;
        }
    }

    function getConfiguration (moduleId) {
        return moduleMap[moduleId];
    }

    // getModulePath('app');
    // getModulePath('app;1.0');
    // getModulePath('ap;1.0');
    // getModulePath('app;1.0.1');
    // getModulePath('webcomponent://app');
    // getModulePath('webcomponent://app;1.0');

    /**
     * Maps from a request path to a Component configuration object, see ./conf/module.conf.default. 
     * 
     * @param {String} path request path 
     * @return {ComponentConfig}
     */
    function resolveFromRequestPath (path) {
        c('getModuleFromPath ' + path);
        if (path.charAt(path.length-1) != '/') path += '/'
        var match = null, item, u;
        for (var module in moduleMap) {
            item = moduleMap[module];
            u = item.path ? item.path : item.url;
            if (u.charAt(u.length-1) != '/') u += '/'
            if (u == path) {
                match = item; 
                break;
            }
        }
        return match;
    }

    return {
        getViewUrl              : getViewUrl,
        moduleRootPath          : moduleRootPath,
        getModuleFolderFilePath : getModuleFolderFilePath,
        getModulePath           : getModulePath,
        COMPONENT_PROTOCOL      : COMPONENT_PROTOCOL,
        resolveFromRequestPath  : resolveFromRequestPath,
        getConfiguration        : getConfiguration  
    }
}