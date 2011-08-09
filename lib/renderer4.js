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
    RENDERED    : 35,
    DONE        : 40
}

Renderer.prototype.render = function (callback) {
    logger.debug('render ' + this.uuid);
    this.state = Renderer.STATES.INIT;
    this._load();
    this.childRenderer = [];
    this._callback = callback;
}

Renderer.prototype._load = function () {
    if (this.resource.STATE >= Resource.STATES.LOADING) { 
        logger.debug('resource ' + this.resource.uuid + ' of renderer ' + this.uuid + ' already rendering');
        return;
    }
    var r = this.resource;
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

Renderer.prototype._parse = function () {
    logger.debug('parse resource ' + this.resource.uuid + " at renderer " + this.uuid);
    this.state = Renderer.STATES.PARSING;
    var self = this;
    var d = this.resource.data.toString();
    this.parser(d, this.resource.url, this.tagmanager).then(function (result) {
        logger.debug('parsed renderer ' + self.uuid);
        self.state = Renderer.STATES.PARSED;
        //self.runtimeDependencies = result.elements;
        //c(result.renderResult);
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
                logger.debug('now, ladies and gentleman!');
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
        , tmplText = this.resource.data.toString()
        , out = []
        , data = {};

    //c(HTMLRenderer.getViewBody(this.parseResult.document));
    mod_mu.compileText('template', this.parseResult.document);
    var stream = mod_mu.render('template', data)
        .on('data', function (data) {
            out.push(data);
        })
        .on('end' , function () {
            self.output = out.join('');
            logger.debug('renderer ' + self.uuid + ' preRender complete');
            self.state = Renderer.STATES.PRERENDERED;
            //c(out.join(''));
        });
}

Renderer.prototype.postRender = function (data) {
    c('postRender ' + this.uuid);
    this._childRenderer.forEach(function (dep) {
        c('collect the stuff from others ' + dep);
        //c(HTMLRenderer.getViewContentMarkup(dep.output));
    });

    //c(this.uuid);
    this.parseResult.elements.forEach(function () {
        c('yoooo!');

    });

    //this._callback(this);
}




exports.Renderer = Renderer;





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