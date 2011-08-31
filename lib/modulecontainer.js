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
 * * download module descriptors from remote web component hosts as resources. 
 * 
 */
module.exports = function (config) {
    //if (!config) { throw new Error('config missing'); }
    var mod_fs                  = require('fs')
        , mod_resourcemanager   = require('./resourcemanager.js')
        , mod_path              = require('path')
        , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
        , mod_sys               = require('sys')
        , componentMap          = {}
        , DEFAULT_VIEW          = 'main.html'
        , COMPONENT_PROTOCOL    = 'webcomponent://'
        , COMPONENT_METAFILE    = 'meta.json'
        , COMPONENT_ROOT        = mod_path.join(__dirname, '..', 'modules');

    scanComponentFolder();

    function handleControllerRequest (req, res) {
        var component = req.params[0],
            controller = req.params[1],
            method = req.method.toLowerCase(),
            mp = mod_path.join(COMPONENT_ROOT, component, 'controller', controller);
        
        mod_path.exists(mp, function (exists, err) {
            if (exists) {
                var module = require(mp);
                if (module[method]) {                	
                    module[method](req, res);
                } else {
                    res.writeHead(404, { 'Content-Type' : 'text/plain'} );
                    res.end('HTTP method not supported');    
                }   
            } else {
                res.writeHead(404, { 'Content-Type' : 'text/plain'} );
                res.end('unknown component ' + component);
            }
        });
    }

    /**
     * Scans the COMPONENT_ROOT folder for component folders, reads the meta file and registers
     * the component. Called automatically upon load. 
     */
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

    /**
     * Returns the local HTTP path to a view resource, that is the local component path plus 
     * the view url. 
     * 
     * [TBD] this must not be mixed up with the view id introduced by Radu's code
     */
    function getViewUrl (moduleConfig, view) {
        var view = view || DEFAULT_VIEW;
        if (moduleConfig.url.indexOf('http://') > -1) {
            throw new Error('not implemented');
        } else {
            return mod_path.join(moduleConfig.url, 'htdocs', view);
        }
    }

    /**
     * Returns the component configuration object related to the supplied component id. 
     * The module id must be of full form <component name>;<version>
     * 
     * @param {String} cid component id
     * @return {ComponentConfiguration} component configuration object
     */
    function getConfiguration (cid) {
        if (!componentMap[cid]) { throw new Error('component ' + cid + ' not found'); }
        return componentMap[cid];
    }

    /**
     * Register a component by the supplied component configuration object. 
     *
     * @param {ComponentConfiguration} conf component configuration object
     */
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
            return mod_path.join(conf.url, path);
        }
    }

    function getViewConfigItem (url, moduleconfig) {
        if (moduleconfig && moduleconfig.views) {
            for (var i = 0; i < moduleconfig.views.length; i++) {
                var c = mod_path.join(moduleconfig.url, moduleconfig.views[i].view);
                
                if (url.indexOf(c) == url.length - c.length) {                	
                    return moduleconfig.views[i];
                } 
            }
        }
        return null;
    }
    
    return {
        getViewUrl              : getViewUrl,
        COMPONENT_ROOT          : COMPONENT_ROOT,
        COMPONENT_PROTOCOL      : COMPONENT_PROTOCOL,
        resolveFromRequestPath  : resolveFromRequestPath,
        getConfiguration        : getConfiguration,
        resolveUrl              : resolveUrl,
        getViewConfigItem       : getViewConfigItem,
        handleControllerRequest : handleControllerRequest
    }
}