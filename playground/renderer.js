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

module.exports = function (tagmanager, modulecontainer) {
    if (!tagmanager || !modulecontainer) { throw new Error('arguments missing'); }
    var parseHtmlView       = require('../lib/parser.js').parseHtmlView,
        tagmanager          = require('../lib/tagmanager.js'),
        Resource            = require('../lib/resources.js').Resource,
        TranslationManager  = require('../lib//translationmanager'),
        mod_path            = require('path'),
        mod_mu              = require('mu'),
        HTMLRenderer        = require('../lib/htmlrenderer.js').HTMLRenderer,
        logger              = require('../lib/logger.js').getLogger(mod_path.basename(module.filename)),
        rendererCount       = 0,
        c                   = console.log;
    
    function Renderer(url, mode, element, data) {
        if (!url) { throw new Error('missing arguments'); }
        this.moduleconfig   = modulecontainer.resolveFromRequestPath(url);
        this.url            = url;
        // [TBD] EVIL! Use resource manager
        this.resource       = new Resource('file://' + mod_path.join(__dirname, '..', url));
        this.resource.load();
        this.translationmanager = new TranslationManager(this.moduleconfig, data.req_lang);
        this.mode           = mode || Renderer.MODES.HTML;
        this.data           = data;
        this.state          = Renderer.STATES.INIT;
        this.uuid           = ++rendererCount;

        this.element        = element;                                      // reference to the element context object created by the parser
        this.parentcontent  = element ? element.elementContent : null;
        this.parentrenderer = null;
        this.parseresult    = null;         
        this.childrenderers = [];
        var self            = this;
        this.resource.addListener('stateChanged', function (resource) {
            if (resource.state >= Resource.STATES.LOADED) {
                if (self.state < Renderer.STATES.PARSED) { 
                    //logger.debug('resource loaded, parse');
                    self.parse(); 
                }
            }
        });
    }
    require('util').inherits(Renderer, require('events').EventEmitter);

    Object.defineProperty(Renderer.prototype, 'state', {
        get : function () {
            return this._state;
        },  
        set : function (val) {
            if ('number' !== typeof val) { throw Error('expected number ' + val); }
            this._state = val;
            this.emit('stateChanged', this);
        }
    });

    Renderer.STATES = {
        INIT            : 0,
        PARSED          : 20,
        CHILDSPARSED    : 30,
        RENDERED        : 40
    };

    Renderer.prototype.parse = function () {
        var self = this,
            resourcecontent = null;
        logger.debug(this.uuid + ': parse');

        if (this.parentcontent) {
            resourcecontent = this.resource.data.toString().replace(new RegExp('<c:content/>'), this.parentcontent);
            logger.debug('include parent content '/* + resourcecontent*/);    
        } else {
            resourcecontent = this.resource.data.toString();
        }

        parseHtmlView(resourcecontent, this.resource.url, tagmanager).then(function (parseresult) {
            logger.debug(self.uuid + ': parsed');
            self.parseresult = parseresult;
            if (parseresult.elements.length == 0) {     
                self.parseresult = parseresult;
                self.render();
            } else {
                parseresult.elements.forEach(function (child) {
                    var moduleconfig = modulecontainer.getConfiguration(child.tag.module);
                    var viewurl = modulecontainer.getViewUrl(moduleconfig, child.tag.view);
                    var childrenderer = new Renderer(viewurl, 'json', child, { req_lang : self.data.req_lang});
                    child.renderer = childrenderer;
                    self.addChildRenderer(childrenderer);
                });      
            }
            this.state = Renderer.STATES.PARSED;
        });
    };

    Renderer.prototype.addChildRenderer = function (renderer) {
        if (!renderer) { throw new Error('wrong type'); } 
        var self = this;
        logger.debug(this.uuid + ': addChildRenderer ' + renderer.uuid);

        renderer.addListener('stateChanged', function (renderer) {
            //logger.debug(self.uuid + ': renderer ' + renderer.uuid + ' changed state to ' + renderer.state);
            var rendered = self.childrenderers.every(function (renderer) {
                return renderer.state >= Renderer.STATES.RENDERED;
            });        
            if (rendered) {
                logger.debug(self.uuid + ' all rendered');
                self.render();
            }
        });

        this.childrenderers.push(renderer);
        renderer.parentrenderer = this;
    };

    Renderer.prototype.render = function () {
        var self = this;
        this.renderTemplate(function (document) {
            self.renderView(document);
            self.state = Renderer.STATES.RENDERED;    
        });
    };

    Renderer.prototype.renderTemplate = function (callback) {
        var document = this.parentrenderer == null ? this.parseresult.document : HTMLRenderer.getViewBody(this.parseresult.document),
            self = this,
            data = this.data || {};
        this.parseresult.elements.forEach(function (element) {
            data['__render__' + element.id] = element.renderer.renderresult.content; 
        });

        // this sucks, because mustache sucks even more
        if (this.element) {
            this.element.attrs.forEach(function (keyvalue) {
                data['attr_' + keyvalue[0]] = keyvalue[1];
            });
        }
        
        
        
        var templating = function(template){
          // 4. Do templating
          var buffer = "";
          mod_mu.compileText('viewtemplate', template);
          var stream = mod_mu.render('viewtemplate', data)
            .on('data', function (c) {
              buffer += c;
            })
            .on('end' , function () {
                callback(buffer);
            });
        };
        var transmgr = this.translationmanager;
        
        switch(transmgr.__state){
          case transmgr.STATES.NO_LOCALES:
            templating(document);
            break;
          case transmgr.STATES.LOADED:
            this.translationRenderer(document, templating);
            break;
          default:
            transmgr.addListener('stateChanged', function (event) { 
              if(transmgr.__state == transmgr.STATES.LOADED){
                self.translationRenderer(document, templating);
              } else {
                templating(document);
              }
            });
            break;
        };
    };
    
    Renderer.prototype.translationRenderer = function(template, callback){
      var self = this,
          transmgr = this.translationmanager
      
      logger.debug('translationRenderer ' + self.uuid);
      template = this.translationmanager.translateTemplate(template);
      
      callback(template);
    };
    

    Renderer.prototype.renderView = function (document) {
        logger.debug(this.uuid + ': render');
        var self = this,
            deps = this.collectChildDependencies();
        this.renderresult = {
            dependencies : {
                css     : deps.css.concat(this.parseresult.dependencies.css.map(function (url) { return self.resolveUrl(url); })),
                script  : deps.script.concat(this.parseresult.dependencies.script.map(function (url) { return self.resolveUrl(url); })),
                locale  : deps.locale.concat(this.parseresult.dependencies.locale.map(function (url) { return self.resolveUrl(url); }))
            }, 
            clientcontroller : this.resolveUrl(this.parseresult.clientcontroller),
            content : document
        };

        if (this.parentrenderer == null) {        
            logger.debug('root renderer');
            this.renderresult.dependencies.css      = Renderer.unique(this.renderresult.dependencies.css);
            this.renderresult.dependencies.script   = Renderer.unique(this.renderresult.dependencies.script);
            this.renderresult.dependencies.locale   = Renderer.unique(this.renderresult.dependencies.locale); 
            if (this.mode == 'html') {
                this.renderresult.content = HTMLRenderer.renderDocument(this, modulecontainer);    
            }
        }
    };

    Renderer.prototype.collectChildDependencies = function () {
        var self = this;
        var css = [],
            script = [],
            locale = [];

        this.childrenderers.forEach(function (renderer) {
            var deps = renderer.getDependencies();
            css      = deps.css.concat(css);
            script   = deps.script.concat(script);
            locale   = deps.locale.concat(locale);
        });

        return {
            css : css,
            script : script,
            locale : locale
        };
    };

    Renderer.prototype.getDependencies = function (isRemote) {
        // [TBD] isRemote
        var self = this, m = function (url) { return self.resolveUrl(url); };
        return {
            css     : this.renderresult.dependencies.css.map(m),
            script  : this.renderresult.dependencies.script.map(m),
            locale  : this.renderresult.dependencies.locale.map(m)
        };
    };

    Renderer.prototype.resolveUrl = function (url, isRemote) {
        if (!url) return;
        // [TBD] WORKAROUND, resolveUrl must only be called once for a URL
        if (url.indexOf('/module') == 0) {
            return url;
        }
        if (url.indexOf(modulecontainer.COMPONENT_PROTOCOL) == 0) {
            return modulecontainer.resolveUrl(this.moduleconfig, url);
        }
        if (url.indexOf('http') == -1) {
            return mod_path.join(this.moduleconfig.url, url);
        }

    };

    Renderer.MODES = {
        HTML    : 1,
        JSON    : 2
    };

    Renderer.unique = function (array) {
        var hlp = {},
            arr = [];
        array.forEach(function (item) {
            if (!hlp[item]) {
                arr.push(item);
                hlp[item] = true;
            }
        });
        return arr;
    };

    Renderer.showTree = function (renderer) {
        var spaces = '                                                       ';
        show(renderer, 0);

        function show(renderer, depth) {
            logger.debug(spaces.substring(0, depth*2) + ' ' + renderer.uuid + '; view template ' + renderer.resource.url);
            for (var i = 0; i < renderer.childrenderers.length; i++) {
                show(renderer.childrenderers[i], depth + 1);
            }
        }
    };

    return {
        Renderer : Renderer
    };
};