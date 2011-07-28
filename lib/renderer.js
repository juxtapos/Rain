var xml             = require('node-xml')
    , mod_sys       = require('sys')
    , mod_promise   = require('promised-io')
    , mod_path      = require('path')
    , logger        = require('./logger.js').getLogger('Renderer')
    , mod_resourcemanager   = require('./resourcemanager.js')

const RESOURCE_LOADER_URLPATH = "/resources?files";
 
function Renderer(modules) {
    this._resources = [];
}

Renderer.prototype.renderDependencies = function (doc, output, tags, resources, mode, defer) {
  logger.debug(mod_sys.inspect(tags));
  logger.debug(mod_sys.inspect(resources));

  if (mode !== 'json') {
    var markup = [];
    
    // add CSS required by requested view
    // [TBD] the resource service should know how to create links to it, not this module. 
    if (resources.css && resources.css.length) {
      markup.push('<link rel="stylesheet" type="text/css" href="');
      markup.push(RESOURCE_LOADER_URLPATH);
      markup.push('=');
      markup.push(resources.css.join(';'));
      markup.push('"/>\n'); 
    }

    // add JavaScript required by requested view
    // [TBD] the resource service should know how to create links to it, not this module. 
    if (resources.script && resources.script.length) {
      markup.push('<script type="application/javascript" src="');
      markup.push(RESOURCE_LOADER_URLPATH);
      markup.push('=');
      markup.push(resources.script.join(';'));
      markup.push('"></script>\n');
    }

    // add module requires and initializer calls
    markup.push('<script type="application/javascript">');
    for (var i = 0, tag; i < tags.length; i++) {
      tag = tags[i];
      var im = tag.instanceid ? ',"text!/instances/' + tag.instanceid + '.js"' : '';
      markup.push('\nrequire(["/modules/');
      markup.push(tag.element.module)
      markup.push('/client.js", "text!/modules/');
      markup.push(tag.element.module);
      markup.push('/main.html?type=json"');
      markup.push(im);
      markup.push('], function (module, template, instance) { module.initView("');
      markup.push(tag.id);
      markup.push('", template, instance) } );');
    } 
    markup.push('\n</script>\n');

    // insert into parsed document
    var doc = output.join('');
    var idx = doc.indexOf('</head>');
    doc = doc.substring(0, idx) + markup.join('') + doc.substring(idx, doc.length);
    return doc;
  } else {
    var body = output.join('').match(/(<body[^>]*>)([\s\S]*)(<\/body>)/mi)[2];
    var obj = { 
      "resources" : {
        "css"       : resources.css
        , "script"  : resources.script
      }
      , "content" : body
    };
    return JSON.stringify(obj);
  }
}
var ci = function (o) {
    console.log(mod_sys.inspect(o));
}
Renderer.prototype.render = function (url, doc, tagmanager, mode, viewfct) {
    var promise = new mod_promise.Promise()
        , results = []
        , self = this;

    this.parse(url, doc, tagmanager, mode).then(function (data) {
        var modules = []
            ,modUrls = {}

        // resolve view template URLs. Should happen in 'modules'
        data.elements.forEach(function (elem) {
            var view = elem.view || 'main.html';
            var viewpath = 'file://' + mod_path.join(__dirname, '..', 'modules', elem.moduleId, 'htdocs', view);
            if (modUrls[viewpath]) {
                //logger.debug('do not resolve again: ' + elem.moduleId);
            } else {
                logger.debug('resolve module: ' + elem.moduleId + ' for ' + elem.id + ', view path: ' + viewpath);
                modules.push(mod_resourcemanager.getResource(viewpath));
                modUrls[viewpath] = true;
            }
        });

        var res;
        mod_promise.all(modules).then(function (resources) {
            logger.debug('required modules loaded ' + sys.inspect(resources));
            return resources;
        }).then(function (resources) {
            var renderers = [];
            if (resources.length >= 0) {
                renderAll(resources, tagmanager).then(function (subdata) {

                    ci('-----------all done')
                    ci(subdata);
                    promise.resolve(subdata);
                });
            }
        });
    });

    //logger.debug('___________render end')

    return promise;
}

function renderAll(resources, tagmanager) {
    var defer = new mod_promise.defer();
    var renderers = [];
    resources.forEach(function (res) {
                var renderer = new Renderer();
                var r = renderer.render('foobar', res.data.toString(), tagmanager, 'json').then(function (r) {
                    console.log('sub view rendered'  + mod_sys.inspect(r))
                    return r;
                });
                renderers.push(r);
            });
    mod_promise.all(renderers).then(function (d) {
        defer.resolve(d);
    });

    return defer;
}


Renderer.prototype.parse = function (url, doc, tagmanager, mode) {
    var defer = new mod_promise.defer()
        , self = this
        , parser = new xml.SaxParser(new DocParser())
        , elements = [] // web components used by view, in parse order
        , outputBuffer = []
        , cssresources = [] // css resorces used by view, in document order
        , scriptresources = [] // javasript resources used by view, in document order

    parser.parseString(doc);

    return defer;

    function DocParser() {
        var tagRemoved = false;

        return function (cb) {
            cb.onStartDocument(function() {
                //console.log('onStartDocument');  
            });

            cb.onEndDocument(function() {
                defer.resolve({ 
                    'url': url
                    , 'output' : outputBuffer.join('')
                    , 'elements' : elements
                    , 'resources' : {
                        'css' : cssresources
                        , 'script' : scriptresources
                    }
                });
            });

            cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                //sys.puts("=====> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
                var instanceid
                    , viewname
                
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
            cb.onComment(copy);

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
 * @param attrs array, out param
 * @return existing or new element id 
 */
function addId(attrs) {
    var eid
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

exports.Renderer = Renderer;