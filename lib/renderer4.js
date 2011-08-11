/**
 * Here be dragons. 
 * 
 * Todos:
 * Fix circular dependencies.
 */

var c                   = console.log
    , mod_util          = require('util')
    , mod_events        = require('events')
    , mod_path          = require('path')
    , mod_mu            = require('mu')
    , mod_resources     = require('./resources.js')
    , Resource          = mod_resources.Resource
    , mod_sys           = require('sys')
    , logger            = require('./logger.js').getLogger(mod_path.basename(module.filename), 0)

uuid = 0;
function Renderer(resource, parser, tagmanager, resmgr) {
    if (!resource || !parser || !tagmanager || !resmgr) throw new Error('parameter missing');
    
    this.uuid = ++uuid;
    this._state = Renderer.STATES.INIT;
    this.resource = resource;
    
    this.parser = parser;
    this.tagmanager = tagmanager;
    this.resourcemanager = resmgr;
    
    this._childRenderer = [];
    this.rendererToElementMap = {};

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
            logger.debug('renderer ' + this.uuid + ' set state to ' + val);
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
    logger.debug('load resource ' + this.resource.uuid + ' of renderer ' + this.uuid);
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
    } else{
        logger.debug('renderer ' + this.uuid + ' load resource ' + r.uuid);
        this.state = Renderer.STATES.LOADING;
        //if ()
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
    logger.debug('parse resource ' + this.resource.uuid + " at renderer " + this.uuid);
    this.state = Renderer.STATES.PARSING;
    var self = this;
    var d = this.resource.data.toString();
    this.parser(d, this.resource.url, this.tagmanager).then(function (result) {
        logger.debug('parsed renderer ' + self.uuid);
        self.state = Renderer.STATES.PARSED;
        self.parseResult = result;
        self.handleDependencies();                
    });
}

Renderer.prototype.handleDepEvent = function (renderer) {
    var self = this;
    logger.debug('handle child renderer event at renderer ' + this.uuid + ', renderer ' + renderer.uuid + ' changed state to ' + renderer.state);
    if (this.allChildsRendered()) {
        logger.debug('all child renderers of ' + this.uuid + ' prerendered or rendered');
        if (this.state >= Renderer.STATES.PRERENDERED) {
            this.postRender();
        }
    }
}

Renderer.prototype.allChildsRendered = function () {
    var allRendered = true;
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
    var self = this,
        deps = this.parseResult.elements,     
        cnt = deps.length;
    if (cnt > 0) {
        deps.forEach(function (dep) {
            var resource = self.resourcemanager.loadResourceByUrl(ModuleManager.getViewUrl(dep.tag.module, dep.view, self.tagmanager));
            logger.debug('adding ' + resource.uuid + ' as dependency to resource ' + self.resource.uuid + ' for renderer ' + self.uuid);        

            //
            // testing locale files
            // if (dep.instanceId) {
                
            //     var localeurl = 'file:///Users/cag/workspace/rain/modules/app/locales/de_DE.js'
            //     resource.addDependency(self.resourcemanager.loadResourceByUrl(localeurl));
            // }

            var childrenderer = new Renderer(resource, self.parser, self.tagmanager, self.resourcemanager);
            childrenderer.parent = this;
            childrenderer.render();
            self.childRenderer.push(childrenderer);
            self.rendererToElementMap[childrenderer.uuid] = dep;
            childrenderer.addListener('stateChanged', function (event) { 
                self.handleDepEvent(event); 
            }); 

        });
        self.preRender({});
    } else {
        logger.debug('no dependencies for ' + this.uuid + ', only render self');
        this.parseResult = {
            document : this.resource.data,
            dependencies : { css : [], script : [], locale : [] }
        }
        this.preRender({});
    }
}

Renderer.prototype.preRender = function (data) {
    logger.debug('preRender ' + this.resource.uuid + ' at renderer ' + this.uuid);
    this.state = Renderer.STATES.PRERENDERING;

    var self = this
        , tmplText = this.parseResult.document
        , out = []
        , data = {};

    this.resolveUrls();

    // 1. preserves the mustache markers that were added to the view source during the parse process. 
    this.childRenderer.forEach(function (renderer) {
        var id = self.rendererToElementMap[renderer.uuid].id;
        data['thing' + id] = '{{{thing' + id + '}}}'
    });
    // 2. [TBD] add data 
    data.city = 'Test'
    data.name = 'Rain'
    data.domains = [{host:'bullubullu.de', state : true, subdomains : '42'}];

    mod_mu.compileText('template', this.parseResult.document);
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

const RESOURCE_LOADER_URLPATH = "/resources?files";

Renderer.prototype.postRender = function (data) {
    logger.debug('--postRender ' + this.uuid);
    var self = this
        , data = {}
        , depmarkup = [] // markup for requesting script and css resources via the Resource Service
        , alldeps = null // all dependencies object
        , cssurls = [], scripturls = [], localeurls = [] // unique URLs to required resources
        , out = []      // temp. for output data

    // fills the data object for mustache with the pre-rendering results of the child renderers. 
    this.childRenderer.forEach(function (renderer) {
        var id = self.rendererToElementMap[renderer.uuid].id;
        //c('add child sucker  ' + id)
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
                        , RESOURCE_LOADER_URLPATH, '=', cssurls.join(';'), '"/>\n'); 
        }
        if (scripturls.length) {
            depmarkup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                        , scripturls.join(';'), '"></script>\n');
        }
        if (localeurls.length) {
            logger.debug('TO BE DONE');
        }
    }

    mod_mu.compileText('template2', this.preRenderResult);
    var stream = mod_mu.render('template2', data)
        .on('data', function (data) {
            out.push(data);
        })
        .on('end' , function () {
            self.renderResult = out.join('');
            // [TBD] yea, ugly, but works for now
            self.renderResult = self.renderResult.substring(0, self.renderResult.indexOf('</head>')) + depmarkup.join('') 
                                 + self.renderResult.substring(self.renderResult.indexOf('</head>') + 7);
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
        obj.reverse().forEach(function (url) {
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
    var url = this.resource.url;
    if (url.indexOf('http://') == 0) {
        var path = url.match(/(^.*htdocs\/)/)[1];
    } else {
        var module = url.match(/modules\/([^\/]+)/)[1];
        //var path = 'file://' + mod_path.join(__dirname, '..', 'modules', module)
        var path = '/modules/' + module + '/htdocs/';
    }

    this.parseResult.dependencies.css = this.parseResult.dependencies.css.map(function (url) {
        return path + url;
    });
    this.parseResult.dependencies.script = this.parseResult.dependencies.script.map(function (url) {
        return path + url;
    });
    this.parseResult.dependencies.locale = this.parseResult.dependencies.locale.map(function (url) {
        return path + url;
    });
}

exports.Renderer = Renderer;





























ModuleManager = {};

ModuleManager.moduleRootPath = mod_path.join(__dirname, '..');

ModuleManager.getViewUrl = function (module, view, tagmanager) {
    var view = view || 'main';
    var p = ModuleManager.getModuleBaseUrl(module, tagmanager); 
    return p + mod_path.join('htdocs', view + '.html');
}

ModuleManager.getModuleBaseUrl = function (module, tagmanager) {
    var tag = tagmanager.getTagByModule(module);
    if (tag) {
        if (tag.module.indexOf('http://') == 0) {
            return tag.module;
        } else {
            return 'file://' + mod_path.join(ModuleManager.moduleRootPath, 'modules', module, '/');
        }
    }
}


function HTMLRenderer () {
    
}
HTMLRenderer.getViewBody = function (doc) {
    return doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi)[1];
}