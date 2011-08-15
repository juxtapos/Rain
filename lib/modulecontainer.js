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

var moduleRootPath = mod_path.join(__dirname, '..', 'modules');

// function scanFolder (folder) {
// 	mod_fs.readdir(moduleRootFolder(), function (err, files) {
// 		if (err) throw err;
// 		mod_resourcemanager.getResources(['file://' + moduleRootFolder() + '/app/htdocs/index.html']).then(function () {
// 		}); 
// 	});
// }

function getViewUrl (module, view, tagmanager) {
    var view = view || 'main';
    var p = getModuleFolderFilePath(module, tagmanager); 
    return p + mod_path.join('htdocs', view + '.html');
}

function getModuleFolderFilePath (module, tagmanager) {
    var tag = tagmanager.getTagByModule(module);
    if (tag) {
        if (tag.module.indexOf('http://') == 0) {
            return tag.module;
        } else {
            return 'file://' + mod_path.join(moduleRootPath, module, '/');
        }
    }
    throw new Error('wrong');
}

function getModuleFolder (module) {
	
}

var DEFAULT_VIEW = 'main.html';
/**
 * Gets an absolute file URL of a module. 
 * [TBD] not here
 * 
 * @param {String} moduleId unique module id
 * @param {String} viewname view name, may be a partial path
 * @return {String}
 */
 /* 
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
*/

exports.getViewUrl 				= getViewUrl;
exports.moduleRootPath 			= moduleRootPath;
exports.getModuleFolderFilePath = getModuleFolderFilePath;