var mod_xml		            = require('node-xml')
	, mod_promise 			= require('promised-io')
	, sys 					= require('sys')
	, logger        		= require('./logger.js').getLogger('TagManager')
	, mod_tagmanager		= require('./tagmanager.js')
	, mod_resourcemanager   = require('./resourcemanager.js')
    , mod_resources         = require('./resources.js')
    , mod_path              = require('path')
    , mod_modules          = require('./modules.js')    

	, c 	= console.log/*function(){}*/
	, i 	= sys.inspect
	, mr    = function () { return Math.random()*0; } // used for testing

function Renderer(tagmgr) {
	if (!tagmgr) { throw new Error('tagmanager required'); }
	this.tagmanager = tagmgr
    this.renderResources = [];
}

Renderer.prototype.render = function (url) {
	var self = this;
	return this._render(url).then(function (renderres) {
        var deps = self.calcDependencies(renderres);
        var o = self.outputHtml(renderres, deps.css, deps.scripts);
        //c(o);
        return o;
    } );
}

Renderer.prototype.calcDependencies = function (renderres) {        
    var self = this
        css = []
        scripts = []
        regex = new RegExp('file://' + mod_path.join(__dirname, '..'));

        this.renderResources.reverse().forEach(function (dep) {            
            path = dep.url.replace(regex, "")
                          .replace(/htdocs.*$/, '');
            Array.prototype.push.apply(css, dep.cssdeps.map(function (item) {
                return mod_path.join(path, item);
            }));
            Array.prototype.push.apply(scripts, dep.scriptdeps.map(function (item) {
                return mod_path.join(path,  item);
            }));
        });
        
        c('# Resource dependencies')
        css.forEach(function (item) {
            c(item);
        })
        scripts.forEach(function (item) {
            c(item);
        })

        
        
        //c(o);

        return { 'css' : css, 'scripts' : scripts };
    }

// [TBD] domain of ResourceService
const RESOURCE_LOADER_URLPATH = "/resources?files";
/**
 * Transforms a RenderResource into HTML output format. 
 */
Renderer.prototype.outputHtml = function (resource, css, scripts) {
    var doc = resource.data.toString();

    var markup = [];
    
    // add CSS required by requested view
    // [TBD] the resource service should know how to create links to it, not this module. 
    if (css && css.length) {
      markup.push('<link rel="stylesheet" type="text/css" href="');
      markup.push(RESOURCE_LOADER_URLPATH);
      markup.push('=');
      markup.push(css.join(';'));
      markup.push('"/>\n'); 
    }

    // add JavaScript required by requested view
    // [TBD] the resource service should know how to create links to it, not this module. 
    if (scripts && scripts.length) {
      markup.push('<script type="application/javascript" src="');
      markup.push(RESOURCE_LOADER_URLPATH);
      markup.push('=');
      markup.push(scripts.join(';'));
      markup.push('"></script>\n');
    }


    if (resource.elements.length > 0) {
        markup.push('\n<script type="application/javascript">\n');
        resource.elements.forEach(function (elem) {
            c(elem)
            markup.push('console.log("', elem.id, ' ");\n');
        });
        markup.push('\n</script>\n');
    }
    

    // add module requires and initializer calls
    // markup.push('<script type="application/javascript">');
    // for (var i = 0, tag; i < tags.length; i++) {
    //   tag = tags[i];
    //   var im = tag.instanceid ? ',"text!/instances/' + tag.instanceid + '.js"' : '';
    //   markup.push('\nrequire(["/modules/');
    //   markup.push(tag.element.module)
    //   markup.push('/client.js", "text!/modules/');
    //   markup.push(tag.element.module);
    //   markup.push('/main.html?type=json"');
    //   markup.push(im);
    //   markup.push('], function (module, template, instance) { module.initView("');
    //   markup.push(tag.id);
    //   markup.push('", template, instance) } );');
    // } 
    // markup.push('\n</script>\n');

    // insert into parsed document
    //var doc = output.join('');
    var idx = doc.indexOf('</head>');
    doc = doc.substring(0, idx) + markup.join('') + doc.substring(idx, doc.length);

    return doc;
}

Renderer.prototype._render = function (url) {
	var p = new mod_promise.Promise()
		, self = this
	//c('render ' + url);

	self.loadResource(url).then(function (resource){
		if (!resource instanceof mod_resources.Resource) { throw new Error('wrong type'); }
		self.parse(resource).then(function (renderres) { 
		    if (!renderres instanceof mod_resources.RenderedViewResource) { throw new Error('wrong type'); }
            self.renderResources.push(renderres);
			var r = []
			    , depsdone = {};
			if (renderres && renderres.elements) {
				renderres.elements.forEach(function (item) {
					if (mod_modules.getModule(item.moduleId)) {
						var viewurl = mod_modules.getViewUrl(item.moduleId, 'main');
						if (!depsdone[viewurl]) {
							r.push(self._render(viewurl));	
						} else { }
						depsdone[viewurl] = true;
					} else {
						throw new Error('module not found');
					}
				});
				mod_promise.all(r).then(function (vals) {
					//c('resolved all sub-renders ' + url);
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

exports.Renderer = Renderer;

function parseHtmlView (resource, tagmanager) {
    var defer = new mod_promise.defer()
    	, url = resource.url
        , parser = new mod_xml.SaxParser(new DocParser())
        , elements = [] // web components used by view, in parse order
        , outputBuffer = []
        , cssresources = [] // css resources used by view, in document order
        , scriptresources = [] // javasript resources used by view, in document order

    parser.parseString(resource.data.toString());
    return defer.promise;

    function DocParser() {
        var tagRemoved = false;

        return function (cb) {
            cb.onStartDocument(function() {
                //console.log('onStartDocument');  
            });

            cb.onEndDocument(function() {
                defer.resolve(new mod_resources.RenderedViewResource(url
	                												, new Buffer(outputBuffer.join(''))
	                												, elements
                													, cssresources
                													, scriptresources)
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
 * @param attrs array, out param
 * @return existing or new element id 
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