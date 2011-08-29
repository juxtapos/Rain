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
 * Here be dragons. 
 * 
 * Todos:
 * Fix circular dependencies.
 */
module.exports = function (modcontainer) {
    if (!modcontainer) { throw new Error('dependencies missing'); }
    var c                   = console.log
        , mod_util          = require('util')
        , mod_events        = require('events')
        , mod_path          = require('path')
        , mod_mu            = require('mu')
        , mod_resources     = require('./resources.js')
        , Resource          = mod_resources.Resource
        , mod_sys           = require('sys')
        , modulecontainer   = modcontainer
        , logger            = require('./logger.js').getLogger(mod_path.basename(module.filename))

    var uuid = 0;
    function Renderer(resource, moduleconf, parser, tagmanager, resmgr, outputMode) {
        if (!resource || !moduleconf || !parser || !tagmanager || !resmgr) throw new Error('parameter missing');
        
        this.uuid = ++uuid;
        this._state = Renderer.STATES.INIT;
        this.resource = resource;
        this.moduleconf = moduleconf;
        this.modulepath = moduleconf.url;
        
        this.parser = parser;
        this.tagmanager = tagmanager;
        this.resourcemanager = resmgr;
        
        this.outputMode = outputMode;
        this._childRenderer = [];
        this.parseResult = null;                     // return value of HTMLParser promise
        this.rendererToElementMap = {};
        this.instanceResources = {};                 // from instanceids to data resources (somewhat hacky currently)

        this.preRenderResult = '';
        this.renderResult = '';

        logger.debug('Renderer() ' + this.uuid + ' created');
    }

    mod_util.inherits(Renderer, mod_events.EventEmitter);

    Object.defineProperty(Renderer.prototype, 'state', {
        get : function () {
            return this._state;
        },  
        set : function (val) {
            if ('number' !== typeof val) { throw Error('expected number ' + val); }
            //if (val !== this._state) {
                //logger.debug('renderer ' + this.uuid + ' set state to ' + val);
                this._state = val;
            
                this.emit('stateChanged', this);
            //}
        }
    });

    Renderer.STATES = {
        INIT            : 1,
        LOADING         : 5,
        LOADED          : 10,
        PARSING         : 15,
        PARSED          : 20,
        PRERENDERING    : 30,
        PRERENDERED     : 35, 
        POSTRENDERING   : 40, 
        COMPLETE        : 50
    }

    Renderer.prototype.render = function () {
        logger.debug('render ' + this.uuid);
        this.state = Renderer.STATES.INIT;
        this._load();
        this.childRenderer = [];
    }

    Renderer.prototype._load = function () {
        logger.debug('load resource ' + this.resource.uuid + '(url:' + this.resource.url + ') of renderer ' + this.uuid);
        var r = this.resource;
        if (this.resource.state == Resource.STATES.LOADING) { 
            logger.debug('already loading, add listener');
            (function (self) {
                r.once('load', function (resource) { 
                    logger.debug('resource ' + resource.uuid  + " at renderer " + self.uuid + ' set state to ' + resource.state);
                    self._parse(); 
                });
            })(this);
        } else if (this.resource.state >= Resource.STATES.LOADED) {
            this._parse(); 
        } else {
            logger.debug('renderer ' + this.uuid + ' load resource ' + r.uuid);
            this.state = Renderer.STATES.LOADING;
            r.load();
            (function (self) {
                r.once('load', function (resource) { 
                    logger.debug('resource ' + resource.uuid  + " at renderer " + self.uuid + ' set state to ' + resource.state);
                    self._parse(); 
                });
            })(this);
        }
    }

    Renderer.prototype._parse = function () {
        if (this.outputMode == 'json') {
            this.outputJson();
            this.state = Renderer.STATES.COMPLETE;
        } else {
            logger.debug('parse resource ' + this.resource.uuid + " at renderer " + this.uuid);
            this.state = Renderer.STATES.PARSING;
            var self = this;
            var d = this.resource.data.toString();
                        
            this.parser(d, this.resource.url, this.tagmanager).then(function (result) {
                logger.debug('parsed renderer ' + self.uuid);

                self.parseResult = result;

                // rewrite URLs received from view temod_pathmplate
                self.parseResult.controller = self.resolveUrl(self.parseResult.controller, self.modulePath, 'controllers/js');
                self.parseResult.dependencies.css = self.parseResult.dependencies.css.map(function (url) {
                    return self.resolveUrl(url, self.modulepath);
                });
                self.parseResult.dependencies.script = self.parseResult.dependencies.script.map(function (url) {
                    return self.resolveUrl(url, self.modulepath);
                });               
                
                self.parseResult.dependencies.locale = self.parseResult.dependencies.locale.map(function (url) {
                    return self.resolveUrl(url, self.modulepath);
                });

                self.handleDependencies();                
                self.state = Renderer.STATES.PARSED;
            });
        }
    }

    Renderer.prototype.outputJson = function () {
        var data = {
        };
        this.renderResult = JSON.stringify(data);
        this.state = Renderer.STATES.COMPLETE;
    }

    Renderer.prototype.handleDepEvent = function (renderer) {
        var self = this;
        //logger.debug('handle child renderer event at renderer ' + this.uuid + ', renderer ' + renderer.uuid + ' changed state to ' + renderer.state);
        if (this.allChildsRendered()) {
            logger.debug('all child renderers of ' + this.uuid + ' prerendered or rendered');
            if (this.state >= Renderer.STATES.PRERENDERED) {
                this.postRender();
            }
        }
    }

    Renderer.prototype.allChildsRendered = function () {
        var allRendered = true
            , renderer;
        for (var i = 0; i < this.childRenderer.length; i++) {
            renderer = this.childRenderer[i];
            if (renderer.state < Renderer.STATES.COMPLETE) {
                allRendered = false;
                return;
            }
        }
        return allRendered;
    }

    Renderer.prototype.handleDependencies = function () {
        logger.debug('loadDependencies at renderer ' + this.uuid + ' for resource ' + this.resource.uuid);
        var self = this
            , renderat
            , deps = this.parseResult.elements
            , resource
            , hasInstances = false
            , cnt = deps.length;

        if (cnt > 0) {
            deps.forEach(function (dep) {

                var config = modulecontainer.getConfiguration(dep.tag.module);
                
                resource = self.resourcemanager.getResourceByUrl(modulecontainer.getViewUrl(config, dep.tag.viewId, self.tagmanager));

                logger.debug('adding ' + resource.uuid + ' as dependency to resource ' + self.resource.uuid + ' for renderer ' + self.uuid);        

                renderat = 'server';
                for (var i = 0; i < dep.attrs.length; i++) {
                    if (dep.attrs[i][0] == 'renderat') {
                        renderat = dep.attrs[i][1];
                    }
                }
                dep.renderat = renderat;

                if (dep.renderat == 'server' && dep.instanceid) {    
                    var hasInstances = true;
                    var dataurl = 'file://' + mod_path.join(__dirname, '..', 'instances', dep.instanceid);
                    var instanceresource = self.resourcemanager.loadResourceByUrl(dataurl);
                    logger.debug('new instance resource ' + instanceresource.url)
                    resource.addDependency(instanceresource);
                }
                // [TBD] do the same for locales...

                resource.load();

                var modulepath = modulecontainer.getConfiguration(dep.tag.module);
                var childrenderer = new Renderer(resource, modulepath, self.parser, self.tagmanager, self.resourcemanager);
                if (dep.instanceid) {
                    childrenderer.instanceResources[dep.instanceid] = instanceresource;
                }
                childrenderer.parent = this;
                childrenderer.render();
                self.childRenderer.push(childrenderer);
                self.rendererToElementMap[childrenderer.uuid] = dep;
                childrenderer.addListener('stateChanged', function (event) { 
                    self.handleDepEvent(event); 
                });
            });

            if (!hasInstances) {
                this.preRender();
            }
        } else {
            logger.debug('no dependencies for ' + this.uuid + ', only render self');
            this.parseResult = {
                                  // [TBD] ugly!
                'document'      : this.parseResult.document ? this.parseResult.document : this.resource.data,
                'controller'    : this.parseResult.controller,
                'dependencies'  : { 
                    'css'       : this.parseResult.dependencies.css, 
                    'script'    : this.parseResult.dependencies.script, 
                    'locale'    : this.parseResult.dependencies.locale 
                }
            }
            this.preRender();
        }
    }

    Renderer.prototype.preRender = function () {
        logger.debug('preRender ' + this.resource.uuid + ' at renderer ' + this.uuid);
        this.state = Renderer.STATES.PRERENDERING;

        var self = this
            , tmplText = this.parseResult.document
            , out = []
            , data = {};

        //this.resolveUrls();

        // 1. preserve the mustache markers that were added to the view source during the parse process
        this.childRenderer.forEach(function (renderer) {
            var id = self.rendererToElementMap[renderer.uuid].id;
            data['thing' + id] = '{{{thing' + id + '}}}'
        });

        // 2. [TBD] add data 
        data.city = 'Test' + new Date().getTime();
        data.name = 'Rain'

        for (var instanceid in this.instanceResources) {
            var resource = this.instanceResources[instanceid];
            try {
                var instanceobj = JSON.parse(resource.data.toString());
                for (var identifier in instanceobj) {
                    if (data[identifier]) { throw new Error('name clash, baby!'); }
                    data[identifier] = instanceobj[identifier];
                }
            } catch (ex) {
                //throw new Error('');
                logger.debug('instance data could not be loaded; ' + ex);
            }
        }

        // 3. Do templating
        mod_mu.compileText('template', tmplText);
        var stream = mod_mu.render('template', data)
            .on('data', function (data) {
                out.push(data);
            })
            .on('end' , function () {
                self.preRenderResult = out.join('');
                self.state = Renderer.STATES.PRERENDERED;
                if (self.childRenderer.length == 0) {
                    self.postRender();
                } 
            });
    }

    var RESOURCE_LOADER_URLPATH = "/resources?files";

    /**
     * Method used to generate in markup view controller code
     */
    Renderer.prototype.generateViewControllerCode = function(initmarkup, eid) {
        var moduleId = this.moduleconf.moduleId;
        var viewName = this.resource.url;
        viewName = viewName.substring(viewName.lastIndexOf("htdocs/") + "htdocs/".length);
        
        var controllerPath;
        
        try {
      	  controllerPath = modcontainer.getModuleViewClientController(moduleId, viewName);
            
      	  if(controllerPath) {      	  
      		  initmarkup.push('\nrequire(["' + this.moduleconf.url + '/htdocs' + controllerPath + '"], function (module) { module.init("' + eid + '"); } );');
      	  }
        }
        catch(ex) {
      	  logger.debug("Resource " + this.resource.url + " doesn't have any client side controller associated.");
        }    	
    }
    
    Renderer.prototype.postRender = function (data) {
        logger.debug('postRender ' + this.uuid);
        var self = this
            , data = {}
            , depmarkup = [] // markup for requesting script and css resources via the Resource Service
            , alldeps = null // all dependencies object
            , cssurls = [], scripturls = [], localeurls = [] // unique URLs to required resources
            , out = []      // temp. for output data
        
        // fills the data object for mustache with the pre-rendering results of the child renderers. 
        this.childRenderer.forEach(function (renderer) {
            var id = self.rendererToElementMap[renderer.uuid].id;
            data['thing' + id] = HTMLRenderer.getViewBody(renderer.renderResult);
        });

        if (this.parent == null) {
            logger.debug('rendering dependencies of root renderer');
            alldeps = this.getDependencies();
            alldeps.css.forEach(function (url) {
                cssurls.push(url);
            });
            alldeps.script.forEach(function (url) {
                scripturls.push(url);
            });
            alldeps.locale.forEach(function (url) {
                localeurls.push(url);
            });
            
            // add JavaScript and CSS resources required by requested view at client runtime. 
            // [TBD] the resource service should know how to create links to it, not this module. 
            if (cssurls.length) {
                depmarkup.push('<link rel="stylesheet" type="text/css" href="'
                            , RESOURCE_LOADER_URLPATH, '=', encodeURIComponent(cssurls.join(';')), '"/>\n'); 
            }
            if (scripturls.length) {
                depmarkup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                            , encodeURIComponent(scripturls.join(';')), '"></script>\n');
            }
            if (localeurls.length) {
                logger.debug('TO BE DONE');
            }
        }

        var initmarkup = [];
        initmarkup.push('\n<script type="application/javascript">\n');

        var eid = '000';
        this.generateViewControllerCode(initmarkup, eid);

        if (typeof this.parseResult !== 'undefined' && typeof this.parseResult.elements !== 'undefined' && this.parseResult.elements.length > 0) {
            
        	var parentRenderer = this;
        	var parentModuleContainer = modcontainer;
        	
            this.parseResult.elements.forEach(function (elem) {
                var im = elem.renderat == 'client' && elem.instanceid ? ',"text!/instances/' + elem.instanceid + '"' : '';
                var l = elem.locale;
                var m = elem.tag.module.substring(0, elem.tag.module.indexOf(';'));
                
                var childTag = parentRenderer.tagmanager.getTagByModuleAndView(elem.tag.module, elem.tag.viewId);
                
                if(childTag) {             	
                   	try {
                		var viewController = parentModuleContainer.getModuleViewControllerByViewId(m, childTag.viewId);
                		
                		if(viewController) {
	                		logger.info("Child view controller: " + viewController);

	                		initmarkup.push('\nrequire(["/modules/', m, "/htdocs", viewController, '"], ');
	                		initmarkup.push('function (module) { module.init("000"); } );');
                		}
                	}
                	catch(ex) {
                		logger.debug("No client controller for child tag: " + childTag.selector + ":" + ex);
                	}
                }
                
                /*initmarkup.push('"text!/modules/', elem.tag.module, '/main.html?type=json"'
                              , im
                              , ', "text!/modules/', elem.tag.module, '/locales/de_DE.js"'
                              , '], '
                              , ' function (module, template, instance, localefile) { \n\tmodule.initView("'
                              , elem.id, '", template, instance, localefile) } );'
                );*/               
            });
            
        }

        initmarkup.push('\n</script>\n');
        depmarkup.push(initmarkup.join(''));

        mod_mu.compileText('template2', this.preRenderResult);
        var stream = mod_mu.render('template2', data)
            .on('data', function (data) {
                out.push(data);
            })
            .on('end' , function () {
                self.renderResult = out.join('');
                // [TBD] yea, ugly, but works for now
                // this is to preserve the cascading rules for included stylesheets that have a lower 
                // precedence than inline stylesheets. 
                if (self.renderResult.indexOf('<style') > -1) {
                    self.renderResult = self.renderResult.substring(0, self.renderResult.indexOf('<style')) + depmarkup.join('') 
                                      + self.renderResult.substring(self.renderResult.indexOf('<style'));
                } else {
                    self.renderResult = self.renderResult.substring(0, self.renderResult.indexOf('</head>')) + depmarkup.join('') 
                                      + self.renderResult.substring(self.renderResult.indexOf('</head>'));
                }
                
                logger.debug('renderer ' + self.uuid + ' postRender complete');
                self.state = Renderer.STATES.COMPLETE;
            });
    }

    Renderer.prototype.getDependencies = function () {
        var css = []
            , script = []
            , locale = []
            , collected = {}
        
        collect(this);
        return {
            'css'       : css
            , 'script'  : script
            , 'locale' : locale
        }

        function collect(renderer) {
            if (renderer.parseResult) {
                foreach(renderer.parseResult.dependencies.css, css);
                foreach(renderer.parseResult.dependencies.script, script);
                foreach(renderer.parseResult.dependencies.locale, locale);
                renderer.childRenderer.forEach(function (renderer) {
                    collect(renderer)
                });
            }
        }

        function foreach (obj, target) {
            obj.forEach(function (url) {
                if (!collected[url]) {
                    target.push(url);
                    collected[url] = true;
                }
            });
        }
    }

    /**
     * From the module-relative URLs used in view templates, host-relative URLs are created.
     */
    Renderer.prototype.resolveUrls = function () {
        this.parseResult.dependencies.css = this.parseResult.dependencies.css.map(function (url) {
            return self.resolveUrl(url, true);
        });
        this.parseResult.dependencies.script = this.parseResult.dependencies.script.map(function (url) {
            return self.resolveUrl(url, true);
        });
        this.parseResult.dependencies.locale = this.parseResult.dependencies.locale.map(function (url) {
            return self.resolveUrl(url, true);
        });
    }

    Renderer.prototype.resolveUrl = function (url, folder, specialDir) {
        if (!url) return null;
        if (url.indexOf(modulecontainer.COMPONENT_PROTOCOL) == 0) {
            var moduleId = url.substring(modulecontainer.COMPONENT_PROTOCOL.length
                , url.indexOf('/', modulecontainer.COMPONENT_PROTOCOL.length + 1));
            var path = url.substring(modulecontainer.COMPONENT_PROTOCOL.length + moduleId.length);
            var modulepath = modulecontainer.getModulePath(moduleId);
            var prefix = '';
            var specialDir = specialDir ? specialDir : '';
            path = mod_path.join(modulepath, specialDir, path);    
            return path;
        } else if (url.indexOf('http://') === 0) {
            return url;
        } else {
            var np = mod_path.join(folder, url);
            return np;
        }
        return url;
    }

    Renderer.prototype.resolveToHost = function () {
            
    }

    function HTMLRenderer () {
        
    }
    HTMLRenderer.getViewBody = function (doc) {
        return doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi)[1];
    }

    return {
        Renderer : Renderer
    }
}