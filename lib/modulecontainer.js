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
module.exports = function (/*config*/) {
    //if (!config) { throw new Error('config missing'); }
    var mod_fs 					= require('fs')
    	, mod_resourcemanager 	= require('./resourcemanager.js')
    	, mod_path 				= require('path')
        , logger            	= require('./logger.js').getLogger(mod_path.basename(module.filename))
        , mod_sys               = require('sys')
        , moduleRootPath        = mod_path.join(__dirname, '..')
        , componentMap          = {}
        , c                     = console.log
        , DEFAULT_VIEW          = 'main.html'
        , COMPONENT_PROTOCOL    = 'webcomponent://'
        , COMPONENT_METAFILE    = 'meta.json'
        , COMPONENT_ROOT        = mod_path.join(__dirname, '..', 'modules');

    scanComponentFolder()
    
    function scanComponentFolder () {
        var p, dir = mod_fs.readdirSync(COMPONENT_ROOT);

        dir.forEach(function (file) {
            if (file.indexOf('_') == 0) { return; }     
            if (!mod_fs.statSync(mod_path.join(COMPONENT_ROOT, file)).isDirectory()) { return; }
            p = mod_path.join(COMPONENT_ROOT, file, COMPONENT_METAFILE);
            var config = JSON.parse(mod_fs.readFileSync(p).toString());
            registerComponent(config);
        });
    }

    function getViewUrl (moduleConfig, view) {
        var view = view || DEFAULT_VIEW;
        var p = getModuleFolderFilePath(moduleConfig); 
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

    function getModulePath (moduleId) {
        var moddesc;
        if (moduleId.indexOf(COMPONENT_PROTOCOL) == 0) { moduleId = moduleId.substring(COMPONENT_PROTOCOL.length); }
        for (module in componentMap) {
            if (moduleId.indexOf(';') == -1) {
                var i = module.indexOf(';');
                var m = module.substring(0, i > -1 ? i : module.length);
            } else {
                m = module;
            }
            if (moduleId == m) {
                moddesc = componentMap[module];
                break;
            }
        }
        if (!moddesc) { throw new Error('config for module ' + moduleId + ' not found'); }
        logger.debug('module ' + moduleId + "->" + moddesc.url);
        return moddesc.url;
    }

    function getConfiguration (moduleId) {
        return componentMap[moduleId];
    }

    function registerComponent (conf) {
        logger.debug('register component ' + conf.moduleId);
        componentMap[conf.moduleId] = conf;
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
        for (var mod in componentMap) {
            item = componentMap[mod];
            u = item.path ? item.path : item.url;
            c(u);
            if (u.charAt(u.length-1) != '/') u += '/'
            if (path.indexOf(u) == 0) {
                match = item; 
                break;
            }
        }
        if (!match) { throw new Error('module config for ' + path + ' not found'); }
        return match;
    }

    /**
     * Resolves a webcomponent:// protocol uri to a host-local or remote HTTP URL.
     * 
     * @param {String} module module id (<name>;<version>)
     * @param {String} url uri to resolve
     * @param {String} resoled URL
     */
    function resolveUrl (module, url) {
        var cpl = COMPONENT_PROTOCOL.length,
            moduleid = url.substring(cpl, url.indexOf('/', cpl + 1)),
            path = url.substring(cpl + moduleid.length),
            conf = getConfiguration(moduleid);
        if (conf.url.indexOf('http') > -1) {
            return conf.url + path;
        } else {
            c(mod_path.join(conf.url, path))
            return mod_path.join(conf.url, path);
        }
    }
    
    return {
        getViewUrl              : getViewUrl,
        moduleRootPath          : moduleRootPath,
        getModuleFolderFilePath : getModuleFolderFilePath,
        getModulePath           : getModulePath,
        COMPONENT_PROTOCOL      : COMPONENT_PROTOCOL,
        resolveFromRequestPath  : resolveFromRequestPath,
        getConfiguration        : getConfiguration,
        resolveUrl              : resolveUrl
    }
}