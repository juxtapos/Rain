"use strict";

module.exports = function (tagmanager, modulecontainer) {
    if (!tagmanager || !modulecontainer) { throw new Error('arguments missing'); }
    var parseHtmlView       = require('../lib/parser.js').parseHtmlView,
        tagmanager          = require('../lib/tagmanager.js'),
        Resource            = require('../lib/resources.js').Resource,
        mod_path            = require('path'),
        HTMLRenderer        = require('../lib/htmlrenderer.js').HTMLRenderer,
        logger              = require('../lib/logger.js').getLogger(mod_path.basename(module.filename)),
        rendererCount       = 0,
        c                   = console.log;

    
    function Renderer(moduleconfig, viewresource, mode, parentcontent) {
        if (!viewresource || !moduleconfig) { throw new Error('missing arguments'); }
        this.resource       = viewresource;
        this.moduleconfig   = moduleconfig;
        this.mode           = mode || Renderer.MODES.HTML;
        this.state          = Renderer.STATES.INIT;
        this.uuid           = ++rendererCount;

        this.parentcontent  = parentcontent;
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
    }

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
            //logger.debug(parseresult);

            // a) no child elements to render, render self
            if (parseresult.elements.length == 0) {
                self.parseresult = parseresult;
                self.render();
            } else {
                parseresult.elements.forEach(function (child) {
                    var moduleconfig = modulecontainer.getConfiguration(child.tag.module);
                    var viewurl = modulecontainer.getViewUrl(moduleconfig, child.tag.view);
                    //logger.debug(viewurl)
                    
                    var childview = new Resource(viewurl);
                    var childrenderer = new Renderer(moduleconfig, childview, 'json', child.elementContent);
                    child.renderer = childrenderer;
                    self.addChildRenderer(childrenderer);
                    logger.debug(self.uuid + ': created renderer, resource' + childview.url);
                    childview.load();
                });      
            }

            this.state = Renderer.STATES.PARSED;

        });
    }

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
    }

    Renderer.prototype.render = function () {
        logger.debug(this.uuid + ': render');
        var self = this,
            body = this.parentrenderer == null ? this.parseresult.document : HTMLRenderer.getViewBody(this.parseresult.document),
            deps = this.collectChildDependencies();

        var document = body;
        this.parseresult.elements.forEach(function (element) {
            //c(element.id + ',' + element.document)
            //c(element)
            
            document = document.replace(new RegExp('{{__' + element.id + '__}}'), element.renderer.renderresult.content);
        });

        this.renderresult = {
            dependencies : {
                css     : deps.css.concat(this.parseresult.dependencies.css.map(function (url) { return self.resolveUrl(url); })),
                script  : deps.script.concat(this.parseresult.dependencies.script.map(function (url) { return self.resolveUrl(url); })),
                locale  : deps.locale.concat(this.parseresult.dependencies.locale.map(function (url) { return self.resolveUrl(url); }))
            }, 
            clientcontroller : this.resolveUrl(this.parseresult.clientcontroller),
            content : document
        }

        if (this.parentrenderer == null) {        
            logger.debug('root renderer');
            this.renderresult.dependencies.css      = Renderer.unique(this.renderresult.dependencies.css);
            this.renderresult.dependencies.script   = Renderer.unique(this.renderresult.dependencies.script);
            this.renderresult.dependencies.locale   = Renderer.unique(this.renderresult.dependencies.locale); 

            // this.renderresult.dependencies.css.forEach(function (dep) { c(dep); });
            // this.renderresult.dependencies.script.forEach(function (dep) { c(dep); });
            // this.renderresult.dependencies.locale.forEach(function (dep) { c(dep); });
            // c('cc:' + this.renderresult.clientcontroller);

            if (this.mode == 'html') {
                var document = HTMLRenderer.renderDocument(this);
                this.renderresult.content = document;    
            } 
        }

        this.state = Renderer.STATES.RENDERED;
    }

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
        }
    }

    Renderer.prototype.getDependencies = function (isRemote) {
        // [TBD] isRemote
        var self = this, m = function (url) { return self.resolveUrl(url); }
        return {
            css     : this.renderresult.dependencies.css.map(m),
            script  : this.renderresult.dependencies.script.map(m),
            locale  : this.renderresult.dependencies.locale.map(m)
        }
    }

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

    }

    Renderer.MODES = {
        HTML    : 1,
        JSON    : 2
    }

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
    }

    Renderer.showTree = function (renderer) {
        var spaces = '                                                       ';
        show(renderer, 0);

        function show(renderer, depth) {
            logger.debug(spaces.substring(0, depth*2) + ' ' + renderer.uuid + '; view template ' + renderer.resource.url);
            for (var i = 0; i < renderer.childrenderers.length; i++) {
                show(renderer.childrenderers[i], depth + 1);
            }
        }
    }

    return {
        Renderer : Renderer
    }
}