/** 
 * Here da magic. 
 */

module.exports = function (resmgr) {
    if (!resmgr) { throw new Error('dependencies missing'); }
    var mod_xml                 = require('node-xml')
        , mod_promise           = require('promised-io')
        , sys                   = require('sys')
        , logger                = require('./logger.js').getLogger('TagManager')
        , mod_tagmanager        = require('./tagmanager.js')
        , mod_resourcemanager   = resmgr
        , mod_resources         = require('./resources.js')
        , mod_path              = require('path')
        //require('./modules.js')
        , c     = console.log
        , i     = sys.inspect
        , mr    = function () { return Math.random()*0; }


    function Renderer(modmgr, tagmgr) {
        if (!modmgr) { throw new Error('module manager required'); }
        if (!tagmgr) { throw new Error('tag manager required'); }
        this.tagmanager = tagmgr;
        this.modulemanager = modmgr;
        this.renderResources = [];
    }

    /** 
     * The main workhorse function. 
     *
     * @param {String} View template absolute file:// URL 
     * @param {String} Render mode, 'json' or 'html'
     * @returns {Promise}
     */
    Renderer.prototype.render = function (url, mode) {
        var self = this;
        return this._render(url).then(function (renderres) {
           c(self.renderResources.length);
            var deps = self.calcDependencies(renderres)
                , out = self[mode!=='json' ? 'outputHtml' : 'outputJson'](renderres, deps.css, deps.scripts, deps.locales);
            return out;
        } );
    }

    /**
     * 
     */
    Renderer.prototype.calcDependencies = function (renderres) {        
        var self = this
            , css = []
            , scripts = []
            , locales = []
            , regex = new RegExp('file://' + mod_path.join(__dirname, '..'));

            this.renderResources.reverse().forEach(function (dep) {    
                //c('................... ' + dep.url)
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
                c(dep.url);
            });

            return { 'css' : css, 'scripts' : scripts, 'locales' : locales };
        }

    // [TBD] domain of ResourceService
    const RESOURCE_LOADER_URLPATH = "/resources?files";
    /**
     * Transforms a RenderResource into HTML output format. 
     * This includes all dependencies of a view that are rendered into the output by using 
     * require.js function calls to have additional dependencies loaded by the web client. 
     *
     * @param {Resource} resource RenderedViewResource
     * @param {String[]} css URL to CSS dependency
     * @param {String[]} scripts URL to JavaScript dependency
     * @param {String[]} locales URL to locale dependency
     */
    Renderer.prototype.outputHtml = function (resource, css, scripts, locales) {
        var doc = resource.data.toString();

        var markup = [];
        
        // add CSS required by requested view
        // [TBD] the resource service should know how to create links to it, not this module. 
        if (css && css.length) {
          markup.push('<link rel="stylesheet" type="text/css" href="'
                      , RESOURCE_LOADER_URLPATH, '=',css.join(';'), '"/>\n'); 
        }
        // add JavaScript required by requested view
        // [TBD] the resource service should know how to create links to it, not this module. 
        if (scripts && scripts.length) {
          markup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                      , scripts.join(';'), '"></script>\n');
        }

        locales.forEach(function (locale) {
            c('l ' + locale);
        });

        if (resource.elements.length > 0) {
            markup.push('\n<script type="application/javascript">\n');

            // this.renderResources.reverse().forEach(function (dep) { 
            //     markup.push('console.log("'+dep.url+'");');
            // });
            resource.elements.forEach(function (elem) {
                var im = elem.instanceId ? ',"text!/instances/' + elem.instanceId + '.js"' : '';
                var l = elem.locale
                markup.push('\nrequire(["/modules/', elem.moduleId, '/client.js"'
                              , ', "text!/modules/', elem.moduleId, '/main.html?type=json"'
                              , im
                              , ', "text!/modules/', elem.moduleId, '/locales/de_DE.xml"'
                              , '], '
                              , ' function (module, template, instance, localefile) { module.initView("'
                              , elem.id, '", template, instance, localefile) } );'
                );
            });
            markup.push('\n</script>\n');
        }
        
        // this, erm, could be done more elegantly. but it frakking works for now ^^ 
        var idx = doc.indexOf('</head>');
        doc = doc.substring(0, idx) + markup.join('') + doc.substring(idx, doc.length);

        return doc;
    }

    /**
     * Renders a resource as JSON. Currently mixes up partials and JSON output, which should not be the same. 
     *
     * @param {RenderedViewResource} resource Resource to render
     * @param {String[]} css URL to CSS dependency
     * @param {String[]} scripts URL to JavaScript dependency
     * @param {String[]} locales URL to locale dependency 
     */
    Renderer.prototype.outputJson = function (resource, css, scripts, locales) {
        var body = resource.data.toString().match(/(<body[^>]*>)([\s\S]*)(<\/body>)/mi)[2];
        var obj = { 
          "resources" : {
            "css"       : css
            , "script"  : scripts
            , "locales" : locales
          }
          , "content" : body
        };
        return JSON.stringify(obj);
    }

    Renderer.prototype._render = function (url) {
        var p = new mod_promise.Promise()
            , self = this
        c('render ' + url);

        self.loadResource(url).then(function (resource){
            if (!resource instanceof mod_resources.Resource) { throw new Error('wrong type'); }
            self.parse(resource).then(function (renderres) { 
                if (!renderres instanceof mod_resources.RenderedViewResource) { throw new Error('wrong type'); }
                self.renderResources.push(renderres);
                //c('pushing ' + renderres.elements)
                var r = []
                    , depsdone = {};
                if (renderres && renderres.elements) {
                    renderres.elements.forEach(function (item) {
                        if (self.modulemanager.getModule(item.moduleId)) {
                            var viewurl = self.modulemanager.getViewUrl(item.moduleId, 'main.html');
                            if (!depsdone[viewurl]) {
                                r.push(self._render(viewurl));  
                            } else { }
                            depsdone[viewurl] = true;
                        } else {
                            throw new Error('module not found');
                        }
                    });
                    mod_promise.all(r).then(function (vals) {
                        c('resolved all sub-renders ' + url);
                        p.resolve(renderres);
                    });
                } else {
                    p.resolve(renderres);
                }
            });
        });
        return p;
    }

    Renderer.prototype.parse = function (resource) {
        return parseHtmlView(resource, this.tagmanager);
    }

    Renderer.prototype.loadResource = function (url) {
        return mod_resourcemanager.getResource(url);
    }

    function parseHtmlView (resource, tagmanager) {
        var defer               = new mod_promise.defer()
            , url               = resource.url
            , parser            = new mod_xml.SaxParser(new DocParser())

            // these are filled by the parser and returned to the caller 
            , elements          = [] // web components used by view, in parse order
            , outputBuffer      = []
            , cssresources      = [] // css resources used by view, in document order
            , scriptresources   = [] // javasript resources used by view, in document order
            , textresources     = [] // javasript resources used by view, in document order

        parser.parseString(resource.data.toString());
        return defer.promise;

        function DocParser() {
            var tagRemoved = false;

            return function (cb) {
                cb.onStartDocument(function() {
                    //console.log('onStartDocument');  
                });

                cb.onEndDocument(function() {
                    //console.log(elements);
                    defer.resolve(new mod_resources.RenderedViewResource(url
                                                                        , new Buffer(outputBuffer.join(''))
                                                                        , elements
                                                                        , cssresources
                                                                        , scriptresources
                                                                        , textresources)
                    );
                });

                cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                    //sys.puts("=====> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
                    var instanceid
                        , viewname

                    //
                    // a document should not be transformed in parser. 
                    // reminder to refactor to new render transformer
                    // 
                    //logger.debug(uri);
                    // [TBD] should do namespace check
                    if (elem === 'link') {
                        attrs.forEach(function (item) {
                            if (item[0] === 'href') {
                                cssresources.push(item[1]);
                                tagRemoved = true;
                            }
                        });
                    } else if (elem == 'script') {
                        attrs.forEach(function (item) {
                            if (item[0] === 'src') {
                                scriptresources.push(item[1]);
                                tagRemoved = true;
                            }
                        });
                    } else if (elem == 'text' && prefix === 'tx') {
                        attrs.forEach(function (item) {
                            if (item[0] === 'key') {
                                textresources.push(item[1]);
                            }
                        });
                    } else {
                        var tag = tagmanager.getTag(elem, attrs, prefix, uri, namespaces);
                        if (tag !== null) {
                            //logger.debug('found tag ' + tag.selector);
                            for (var i = 0; i < attrs.length; i++) {
                                if (attrs[i][0] === 'instanceid') {
                                    instanceid = attrs[i][1];
                                    break;
                                }
                                if (attrs[i][0] === 'view') {
                                    viewname = attrs[i][1];
                                    break;
                                }
                            }
                            var eid = addId(attrs);
                            var elemResource = {
                                'id' : eid 
                                , 'instanceId'  : instanceid
                                , 'moduleId'    : tag.module 
                                , 'view'        : viewname
                            };
                            elements.push(elemResource);
                        }
                    }

                    if (!tagRemoved) {
                        outputBuffer = outputBuffer.concat(copyStartTag(elem, attrs, prefix, uri, namespaces));
                    }
                    addId(attrs);
                });

                cb.onEndElementNS(function(elem, prefix, uri) {
                    if (!tagRemoved) {
                        outputBuffer.push("</", (prefix ? prefix + ":" : ""), elem, ">");
                    } else { }
                    tagRemoved = false;
                });

                cb.onCharacters(copy);
                cb.onCdata(copy);
                //cb.onComment(copy);

                function copy(chars) {
                    outputBuffer.push(chars);
                };

                cb.onWarning(function(msg) {
                    logger.warn('warning ' + msg);
                });

                cb.onError(function(msg) {
                    logger.error('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
                });
            }
        }
    }

    /**
     * add an 'id' attribute to identify the element when inserting its rendered content
     *
     * @param {attributes[]} attrs attributes from node-xml sax
     * @return {String} existing or new element id 
     */
    function addId(attrs) {
        var eid
            // [TBD] use fixed format so file sizes is guaranteed on equal input
            , elemId = "module" + new Date().getTime() + "" + parseInt(Math.random()*10);
        for (var j = 0, al = attrs.length, hasId = false; j < al; j++) {
            if (attrs[j][0] === "id") {
                eid = attrs[j][1];
                hasId = true;
            }
        }
        if (!hasId) {
            attrs.push(["id", elemId]);
            return elemId
        } else {
            return eid;
        }
    }

    function copyStartTag(elem, attrs, prefix, uri, namespaces) {
        var outputBuffer = [];
        outputBuffer.push("<", (prefix ? prefix + ":" : ""), elem);
        if (namespaces.length > 0 || attrs.length > 0) {
            outputBuffer.push(" ");
        }
        //for (i = 0; i < namespaces.length; i++) {
        //    outputBuffer.push("xmlns:" + namespaces[i][0] + "=\"" + namespaces[i][1] + "\" ");
        //    savedNamespaces[namespaces[i][1]] = namespaces[i][0]; 
        //}
        for (var i = 0; i < attrs.length; i++) {
            outputBuffer.push(attrs[i][0], '="', attrs[i][1], '"');
            if (i < attrs.length - 1) { 
                outputBuffer.push(' '); 
            }
        }
        outputBuffer.push(['meta', 'link', 'br', 'img', 'input'].indexOf(elem) > -1 ? '/>' : '>');
        return outputBuffer;
    }

    return {
        'Renderer' : Renderer
    }
}