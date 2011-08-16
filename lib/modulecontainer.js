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
var mod_fs 					= require('fs')
	, mod_resourcemanager 	= require('./resourcemanager.js')
	, mod_path 				= require('path')
    , logger            	= require('./logger.js').getLogger(mod_path.basename(module.filename))
    , mod_sys               = require('sys')
    , moduleRootPath = mod_path.join(__dirname, '..', 'modules')
    , config = mod_fs.readFileSync(mod_path.join(__dirname, '..', 'module.conf.local')).toString()
    , moduleMap = JSON.parse(config)
    , c = console.log
    //, DEFAULT_VIEW = 'main.html';
    , COMPONENT_PROTOCOL    = 'webcomponent://'

function getViewUrl (module, view, tagmanager) {
    var view = view || 'main';
    var p = getModuleFolderFilePath(module, tagmanager); 
    return p + mod_path.join('htdocs', view + '.html');
}

function getModuleFolderFilePath (module, tagmanager) {
    var tag = tagmanager.getTagByModule(module);
    logger.debug('getModuleFolderFilePath module ' + module);
    if (tag) {
        if (tag.module.indexOf('http://') == 0) {
            return tag.module;
        } else {
            return 'file://' + mod_path.join(moduleRootPath, module, '/');
        }
    }
    throw new Error('module ' + module + ' not found');
}

function getModuleFolder (module) {
	
}

function getModulePath (moduleId) {
    var moddesc;
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
        c('module ' + moduleId + "->" + moddesc.urls[0]);
        return moddesc.urls[0];
    }
}

// getModulePath('app');
// getModulePath('app;1.0');
// getModulePath('ap;1.0');
// getModulePath('app;1.0.1');
// getModulePath('webcomponent://app');
// getModulePath('webcomponent://app;1.0');



exports.getViewUrl 				= getViewUrl;
exports.moduleRootPath 			= moduleRootPath;
exports.getModuleFolderFilePath = getModuleFolderFilePath;
exports.getModulePath           = getModulePath;