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

exports.ComponentContainer  			= ComponentContainer;
exports.WebComponent        			= WebComponent;

var mod_fs                  = require('fs')
    , mod_tagmanager        = require('./tagmanager.js')
    , Renderer              = require('./renderer.js').Renderer
    , mod_path              = require('path')
    , mod_url               = require('url')
    , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))
    , mod_events            = require('events')
    , mod_util              = require('util')
    , mod_sys               = require('sys')
    , _curr_comp_container	= null;

/**  
 * Component Container, Manager, Factory, whatever. All module related thingz must belong to us. 
 *
 * Todos:
 *
 * * download component descriptors from remote web component hosts as resources. 
 * 
 */
function ComponentContainer(resourcemanager) {
    this.resourcemanager = resourcemanager;
    this.componentMap = {};
    this.scanComponentFolder();

    // testing remotes
    this.registerComponent({
        "id"        : "remote;1.0",
        "url"       :  "http://127.0.0.1:1338/modules/weather/htdocs/main.html"
    });
}

ComponentContainer.DEFAULT_VIEW          = '/htdocs/main.html';
ComponentContainer.COMPONENT_PROTOCOL    = 'webcomponent://';
ComponentContainer.COMPONENT_METAFILE    = 'meta.json';
ComponentContainer.COMPONENT_ROOT        = Server.conf.server.componentPath;

ComponentContainer.prototype.handleViewRequest = function (req, res, tagfactory) {
    var parse         = mod_url.parse(req.url),
        query         = req.query,
        outputMode    = (query['rain.output'] || 'html').toLowerCase(),
        modulename    = req.params[0],
        viewpath      = req.params[1],
        data          = {},
        self          = this,
        key;
    
    console.time('render');
    for (key in query) {
        data['req_' + key] = query[key]; 
    }
      
    var componentid  = this.getComponentByRequestPath(parse.pathname),
    component = this.createComponent(componentid);
    component.initialize(viewpath, outputMode, data, /*this,*/ 
    			req, res, undefined, tagfactory);
    
    component.once('rendered', function(component) {
	    var renderer = component.renderer,
        responseData = '',
        contentType = 'application/json';
    
	    if (renderer.state == Renderer.STATES.RENDERED) {
	        switch(renderer.mode){
	          case "html":
	            contentType = 'text/html';
	            responseData = renderer.renderresult.content;	            	            
	            break;
	            
	          default:
	            responseData = JSON.stringify(renderer.renderresult);
	        }
	        
	        res.setHeader('Content-Type', contentType+'; charset=UTF-8');
	        res.setHeader('Content-Length', responseData.length);
	        res.end(responseData, 'utf8');
	        console.timeEnd('render');
	        //Renderer.showTree(render1);
	    }
	});	    
    
    /*
    if (query[RAIN_INSTANCE_PARAM]) {
        logger.debug('requiring instance per request parameter');
        if (query[RAIN_INSTANCE_PARAM] instanceof Array) {
            query[RAIN_INSTANCE_PARAM].forEach(function (iid) { addInstance(iid, resource, renderer); });
        } else {
            addInstance(query[RAIN_INSTANCE_PARAM], resource, renderer);
        }
    }
    
    function addInstance (id, resource, renderer) {
        var dataurl = 'file://' + mod_path.join(__dirname, '..', 'instances', id);
        var instanceresource = mod_resourcemanager.getResourceByUrl(dataurl).load();
        instanceresource.load();
        resource.addDependency(instanceresource);
        renderer.instanceResources[id] = instanceresource;
    }
    */
};

/**
 * Method used to return all views configuration items that match a certain 
 * filter.
 * 
 * @param {String} filter This is the current filter used for obtaining views.
 * @example type="dashboard"
 * 
 * @return {Array} A list of view configuration dictionaries.
 */
ComponentContainer.prototype.getViewsByFilter = function(filter) {
	if(filter.indexOf("=") == -1) {
		throw new Error("Currently we only support simple filters: viewAttribute=value ----> Given " + filter);
	}
	
	var viewsToReturn = [];
	
	for(var key in this.componentMap) {
		var views = this.componentMap[key].views;
		
		for(var i in views) {
			var viewConfig = views[i];
			
			var tmp = filter.split("=");
			var filterCol = tmp[0];
			var filterValue = tmp[1];
			
			if(viewConfig[filterCol]) {
				if((viewConfig[filterCol] instanceof Array) &&
						viewConfig[filterCol].indexOf(filterValue) != -1) {
					viewConfig.moduleUrl = this.componentMap[key].url;
					viewsToReturn.push(viewConfig);
				}
				else if(viewConfig[filterCol] == filterValue) {
					viewsToReturn.push(viewConfig);
				}
			}
		}
	}
	
	return viewsToReturn;
};

function WebComponent(config, componentcontainer, resourcemanager) {
    this.config = config;    
    this.componentcontainer = componentcontainer;
    this.resourcemanager = resourcemanager;
    this.params = {};
}
mod_util.inherits(WebComponent, mod_events.EventEmitter);

WebComponent.prototype.initialize = function (viewpath, outputMode, data, /*modulecontainer,*/ req, res, element, tagfactory) {
    var self = this,
        controllerpath = mod_path.join(Server.conf.server.serverRoot, this.config.url, 'controller', 'js', viewpath + '.js');
    logger.debug('check for server-side view controller ' + controllerpath);
    
    if(!req) {
    	this.params = {};
    }
    else if(req.query) {
    	this.params = req.query;
    }
    
    var path = this.componentcontainer.getViewUrl(this.config, viewpath);
    try {
        this.controller = require(controllerpath);
        this.controller.handleRequest(req, res);
    } catch (exception) {
        logger.debug('controller not found');
    }
    self.tagmanager = new mod_tagmanager.TagManager(self.config.taglib);
    
    self.renderer  = new Renderer(this, path, outputMode, element, data, tagfactory);

    self.renderer.once('stateChanged', function (renderer) {
        if (renderer.state == Renderer.STATES.RENDERED) {
            self.emit('rendered', self);
        }
    });
}
 
ComponentContainer.prototype.createComponent = function (componentid) {
    var componentconfig = this.getConfiguration(componentid),
        component = new WebComponent(componentconfig, this, this.resourcemanager);
    return component;
}

ComponentContainer.prototype.handleControllerRequest = function (req, res) {
    var component = req.params[0],
        controller = req.params[1],
        method = req.method.toLowerCase(),
        mp = mod_path.join(ComponentContainer.COMPONENT_ROOT, component, 'controller', controller);

    mod_path.exists(mp, function (exists, err) {
        if (exists) {
            var module = require(mp);
            if (module[method]) {
                var handlerresponse = module[method](req, res);
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
ComponentContainer.prototype.scanComponentFolder = function () {
    var p, 
        self = this,
        dir = mod_fs.readdirSync(ComponentContainer.COMPONENT_ROOT);

    dir.forEach(function (file) {
        if (file.indexOf('_') == 0) { return; }     
        if (!mod_fs.statSync(mod_path.join(ComponentContainer.COMPONENT_ROOT, file)).isDirectory()) { return; }
        p = mod_path.join(ComponentContainer.COMPONENT_ROOT, file, ComponentContainer.COMPONENT_METAFILE);
        var config = JSON.parse(mod_fs.readFileSync(p).toString());
        self.registerComponent(config);
    });
}

/**
 * Returns the local HTTP path to a view resource, that is the local component path plus 
 * the view url. 
 * 
 * [TBD] this must not be mixed up with the view id introduced by Radu's code
 */
ComponentContainer.prototype.getViewUrl = function (moduleConfig, view) {
    var view = view || ComponentContainer.DEFAULT_VIEW;
    if (moduleConfig.url.indexOf('http://') > -1) {
        //throw new Error('not implemented');
        return moduleConfig.url;
    } else {
        return mod_path.join(moduleConfig.url, /*'htdocs',*/ view);
    }
}

/**
 * Return the local url of the view identified by view id.
 */
ComponentContainer.prototype.getViewUrlByViewId = function(moduleConfig, viewid) {
	var view;
	
	if(!moduleConfig.views && viewid) {
		throw new Error("View " + viewid + " is not defined.");
	}
	
	moduleConfig.views.forEach(function(item) {
		if(item.viewId == viewid) {
			view = item;
		}
	});
	
	if(!view) {
		throw new Error("View " + viewid + " is not defined.")
	}
	
	if(moduleConfig.url.indexOf("http://") > -1) {
		return moduleConfig.url;
	}
	else {
		return mod_path.join(moduleConfig.url, view.view);
	}
}

/**
 * Returns the component configuration object related to the supplied component id. 
 * The module id must be of full form <component name>;<version>
 * 
 * @param {String} cid component id
 * @return {ComponentConfiguration} component configuration object
 */
ComponentContainer.prototype.getConfiguration = function (cid) {
    if (!this.componentMap[cid]) { throw new Error('component ' + cid + ' not found'); }
    return this.componentMap[cid];
}

/**
 * Register a component by the supplied component configuration object. 
 * The configuration object must contain 'id' and 'url' properties, otherwise it is rejected.
 *
 * @param {ComponentConfiguration} conf component configuration object
 */
ComponentContainer.prototype.registerComponent = function (conf) {
    if (!conf.id || !conf.url) {
        logger.warn('Component ' + JSON.stringify(conf) + ' could not be registered');
        return;
    }
    logger.debug('register component ' + conf.id);
    this.componentMap[conf.id] = conf;
}

/**
 * Maps from a request path to a Component configuration object, see ./conf/module.conf.default. 
 * 
 * @param {String} path request path 
 * @return {String} component id
 */
ComponentContainer.prototype.getComponentByRequestPath = function (path) {
    if (path.charAt(path.length-1) != '/') path += '/'
    var match = null, item, u;
    for (var mod in this.componentMap) {
        item = this.componentMap[mod];
        u = item.path ? item.path : item.url;
        if (u.charAt(u.length-1) != '/') u += '/'
        if (path.indexOf(u) == 0) {
            match = item.id; 
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
ComponentContainer.prototype.resolveUrl = function (module, url) {
    var cpl = ComponentContainer.COMPONENT_PROTOCOL.length,
        moduleid = url.substring(cpl, url.indexOf('/', cpl + 1)),
        path = url.substring(cpl + moduleid.length),
        conf = this.getConfiguration(moduleid);
    if (conf.url.indexOf('http') > -1) {
        return conf.url + path;
    } else {
        return mod_path.join(conf.url, path);
    }
}

ComponentContainer.prototype.getViewConfigItem = function (url, moduleconfig) {
    if (moduleconfig && moduleconfig.views) {
        for (var i = 0; i < moduleconfig.views.length; i++) {
            var c = mod_path.join(moduleconfig.url, moduleconfig.views[i].view);
            
            if (url.lastIndexOf(c) >= 0) {
                return moduleconfig.views[i];
            } 
        }
    }
    return null;
}