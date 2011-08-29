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
module.exports = function (config) {
    if (!config) { throw new Error('config missing'); }
    var mod_fs 					= require('fs')
    	, mod_resourcemanager 	= require('./resourcemanager.js')
    	, mod_path 				= require('path')
        , logger            	= require('./logger.js').getLogger(mod_path.basename(module.filename))
        , mod_sys               = require('sys')
        , moduleRootPath        = mod_path.join(__dirname, '..')
        , moduleMap             = config
        , c = console.log
        , DEFAULT_VIEW = 'main.html'
        , COMPONENT_PROTOCOL    = 'webcomponent://';
    
    /**
     * Method used to return view url for a specified module.
     * 
     * @param moduleConfig Module configuration we want to solve a url for.
     * @param viewId 
     * @param tagmanager
     */
    function getViewUrl (moduleConfig, viewId, tagmanager) {
    	var view = DEFAULT_VIEW;
    	
    	try {
        	var tmpView = getModuleViewPathByViewId(moduleConfig.moduleId, viewId);
        	
        	if(tmpView) {
        		view = tmpView;
        	}
    	}
    	catch(ex) {
    		logger.warn(ex);
    	}
                
        var p = getModuleFolderFilePath(moduleConfig, tagmanager); 
        if (moduleConfig.url.indexOf('http://') > -1) {
            return p + '/' + view;
        } else {
            return p + mod_path.join('htdocs', view);
        }
    }


    function getModuleFolderFilePath (moduleConfig) {
        if (moduleConfig.url.indexOf('http://') == 0) {
            return moduleConfig.url;
        } else {
            var path = 'file://' + mod_path.join(moduleRootPath, moduleConfig.url, '/');
            return path;
        }
    }

    /**
     * Method used to return a module entry from configuration.
     */
    function getModuleEntry(moduleId) {
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
        if (!moddesc) { throw new Error('config for module ' + moduleId + ' not found'); }
        
        return moddesc;
    }
    
    function getModulePath (moduleId) {
    	var moddesc = getModuleEntry(moduleId);
    	
        logger.debug('module ' + moduleId + "->" + moddesc.url);
        return moddesc.url;
    }
    
    /**
     * This is still experimental in here.
     * I want to support configuration of views in config.
     * 
     * @return the url of client controller.
     */
    function getModuleViewClientController(moduleId, viewName) {
    	var module = getModuleEntry(moduleId);
    	
    	for(var viewIndex in module.views) {
    		var view = module.views[viewIndex];
    		
    		if(view.view == viewName) {
    			return view.controller;
    		}
    	}
    	    	
    	throw new Error("Client controller for module " + moduleId + " and view " + viewName + " not found.");
    }
    
    /**
     * Method used to return the controller by view id.
     */
    function getModuleViewControllerByViewId(moduleId, viewId) {    	
    	var ret = getModuleViewAttribute(moduleId, viewId, "controller");
    	
    	if(ret) {
    		return ret;
    	}    	
    	
    	throw new Error("Client controller for module " + moduleId + " and viewid " + viewId + " not found.");    	
    }
    
    /**
     * Method used to return the html path for a specified view id.
     */
    function getModuleViewPathByViewId(moduleId, viewId) {
    	var ret = getModuleViewAttribute(moduleId, viewId, "view");
    	
    	if(ret) {
    		return ret;
    	}
    	
    	throw new Error("Client view path for module " + moduleId + " and viewid " + viewId + " not found.");    	
    }
    
    
    /**
     * Method used to return a specified view attribute from configuration.
     */
    function getModuleViewAttribute(moduleId, viewId, attrName) {
    	var module = getModuleEntry(moduleId);
    	
    	for(var viewIndex in module.views) {    		
    		var view = module.views[viewIndex];
    		
    		if(view.viewId == viewId) {
    			return view[attrName];
    		}
    	}    	
    }

    function getConfiguration (moduleId) {
        return moduleMap[moduleId];
    }

    /**
     * Maps from a request path to a Component configuration object, see ./conf/module.conf.default. 
     * 
     * @param {String} path request path 
     * @return {ComponentConfig}
     */
    function resolveFromRequestPath (path) {    	    	
        if (path.charAt(path.length-1) != '/') path += '/'
        var match = null, item, u;
        for (var mod in moduleMap) {
            item = moduleMap[mod];
            u = item.path ? item.path : item.url;
            if (u.charAt(u.length-1) != '/') u += '/'
            if (u == path) {
                match = item; 
                break;
            }
        }
        if (!match) { throw new Error('module config for ' + path + ' not found'); }
        return match;
    }

    return {
        getViewUrl              : getViewUrl,
        moduleRootPath          : moduleRootPath,
        getModuleFolderFilePath : getModuleFolderFilePath,
        getModulePath           : getModulePath,
        COMPONENT_PROTOCOL      : COMPONENT_PROTOCOL,
        resolveFromRequestPath  : resolveFromRequestPath,
        getConfiguration        : getConfiguration,
        getModuleViewClientController : getModuleViewClientController,
        getModuleViewControllerByViewId : getModuleViewControllerByViewId,
        getModuleViewPathByViewId : getModuleViewPathByViewId
    }
}