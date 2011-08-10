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
    , logger            = require('./logger.js').getLogger(mod_path.basename(module.filename))

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
        if (val !== this._state) {
            logger.debug('renderer ' + this.uuid + ' set state to ' + val);
            this._state = val;
            this.emit('stateChanged', this);
        }
    }
});

Renderer.STATES = {
    INIT        : 1,
    LOADING     : 5,
    LOADED      : 10,
    PARSING     : 15,
    PARSED      : 20,
    RENDERING   : 30,
    PRERENDERED : 32,
    COMPLETE    : 35
}

Renderer.prototype.render = function () {
    logger.debug('render ' + this.uuid);
    this.state = Renderer.STATES.INIT;
    this._load();
    this.childRenderer = [];
}

Renderer.prototype._load = function () {
    logger.debug('resource ' + this.resource.uuid + ' of renderer ' + this.uuid + ' already rendering');
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
    if (renderer.state >= Renderer.STATES.PRERENDERED) {
        if (this.allChildsPreRendered()) {
            logger.debug('all child renderers of ' + this.uuid + ' prerendered or rendered');
            if (this.state >= Renderer.STATES.PRERENDERED) {
                this.postRender();
            }
        }
    }
}

Renderer.prototype.allChildsPreRendered = function () {
    var allRendered = true;
    for (var i = 0; i < this.childRenderer.length; i++) {
        renderer = this.childRenderer[i];
        if (renderer.state < Renderer.STATES.PRERENDERED) {
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
            var resource = self.resourcemanager.loadResourceByUrl(ModuleManager.getViewUrl(dep.moduleId, dep.view));
            logger.debug('adding ' + resource.uuid + ' as dependency to resource ' + self.resource.uuid + ' for renderer ' + self.uuid);        
            var childrenderer = new Renderer(resource, self.parser, self.tagmanager, self.resourcemanager);
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
        this.preRender({});
    }
}

Renderer.prototype.preRender = function (data) {
    logger.debug('preRender ' + this.resource.uuid + ' at renderer ' + this.uuid);
    this.state = Renderer.STATES.RENDERING;

    var self = this
        , tmplText = this.parseResult.document
        , out = []
        , data = {};

    // 1. preserves the mustache markers that were added to the view source during the parse process. 
    this.childRenderer.forEach(function (renderer) {
        var id = self.rendererToElementMap[renderer.uuid].id;
        data['thing' + id] = '{{{thing' + id + '}}}'
    });
    // 2. [TBD] add data 
    //data.domains = [{host:'bullubullu.de', state : true, subdomains : '42'}];

    mod_mu.compileText('template', this.parseResult.document);
    var stream = mod_mu.render('template', data)
        .on('data', function (data) {
            out.push(data);
        })
        .on('end' , function () {
            self.preRenderResult = out.join('');
            //logger.debug('renderer ' + self.uuid + ' preRender complete');
            self.state = Renderer.STATES.PRERENDERED;
        });
}

const RESOURCE_LOADER_URLPATH = "/resources?files";
Renderer.prototype.postRender = function (data) {
    logger.debug('postRender ' + this.uuid);
    var self = this
        , data = {};

    // fills the data object for mustache with the pre-rendering results of the child renderers. 
    this.childRenderer.forEach(function (renderer) {
        var id = self.rendererToElementMap[renderer.uuid].id;
        data['thing' + id] = HTMLRenderer.getViewBody(renderer.preRenderResult);
    });

    var cssurls = [], scripturls = [], localeurls = [];
    this.parseResult.dependencies.css.forEach(function (url) {
        cssurls.push(url);
    });
    this.parseResult.dependencies.script.forEach(function (url) {
        scripturls.push(url);
    });
    this.parseResult.dependencies.locale.forEach(function (url) {
        localeurls.push(url);
    });

    var markup = [];
    if (cssurls.length) {
        markup.push('<link rel="stylesheet" type="text/css" href="'
                    , RESOURCE_LOADER_URLPATH, '=', cssurls.join(';'), '"/>\n'); 
    }
    // add JavaScript required by requested view
    // [TBD] the resource service should know how to create links to it, not this module. 
    if (scripturls.length) {
        markup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                    , scripturls.join(';'), '"></script>\n');
    }
    if (localeurls.length) {
        logger.debug('l ' + localeurls.join(''));
    }

    c(markup.join(''));

    var out = [];
    mod_mu.compileText('template', this.preRenderResult);
    var stream = mod_mu.render('template', data)
        .on('data', function (data) {
            out.push(data);
        })
        .on('end' , function () {
            self.renderResult = out.join('');
            logger.debug('renderer ' + self.uuid + ' postRender complete');
            self.state = Renderer.STATES.COMPLETE;
            c(out.join(''));
        });
}

exports.Renderer = Renderer;




urlresolver = function (renderres) {        
    var self = this
        , css = []
        , scripts = []
        , locales = []
        , regex = new RegExp('file://' + mod_path.join(__dirname, '..'));

    this.renderResources.reverse().forEach(function (dep) {    
        //logger.debug('................... ' + dep.url)
        path = dep.url.replace(regex, "")
                      .replace(/htdocs.*$/, '');
        Array.prototype.push.apply(css, dep.cssdeps.map(function (item) {
            return mod_path.join(path, item);
        }));
        Array.prototype.push.apply(scripts, dep.scriptdeps.map(function (item) {
            return mod_path.join(path,  item);
        }));
        Array.prototype.push.apply(locales, dep.localedeps.map(function (item) {
            return mod_path.join(path,  'i18n', item);
        }));

    });

    this.renderResources.reverse().forEach(function (dep) {
        logger.debug(dep.url);
    });

    return { 'css' : css, 'scripts' : scripts, 'locales' : locales };
}


ModuleManager = {};
ModuleManager.getViewUrl = function (module, view) {
    var view = view || 'main';
    if (module && module.indexOf('http://') === 0) {
         var p = module + mod_path.join('htdocs', view + '.html');    
    } else {
        var p = 'file://' + mod_path.join(__dirname, '..', '/modules/', module, 'htdocs', view + '.html');    
    }
    return p;
}

function HTMLRenderer () {
    
}
HTMLRenderer.getViewBody = function (doc) {
    return doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi)[1];
}