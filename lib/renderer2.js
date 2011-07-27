var mod_xml		            = require('node-xml')
	, mod_promise 			= require('promised-io')
	, sys 					= require('sys')
	, logger        		= require('./logger.js').getLogger('TagManager')
	, mod_tagmanager		= require('./tagmanager.js')
	, mod_resourcemanager   = require('./resourcemanager.js')
	, mod_resources			= require('./resources.js')

	, c 	= console.log/*function(){}*/
	, i 	= sys.inspect
	, mr    = function () { return Math.random()*10; } 


var urls = {
	'foo.html' : {
		dependencies : {
			css : [ 'foo.css', 'foo2.css' ]
			, urls : ['1.html', '2.html']
		}
	},
	'1.html' : {
		dependencies : {
			css : [ '1.css', '1.1.css' ]
		}
	}, 
	'2.html' : {
		dependencies : {
			css : ['2.css']
			, urls : ['3.html']
		}
	}
	,'3.html' : {
		dependencies : {
			css  : [ 'number6.css' ] 
			, urls : ['4.html']
		}
	}
	,'4.html' : {
		dependencies : {
			css  : [ 'number6.css' ] 
		}
	}
}

function Renderer(tagmgr) {
	if (!tagmgr) { throw new Error('tagmanager required'); }
	this.dependencies = [];
	this.tagmanager = tagmgr
}

Renderer.prototype.addDependency = function (url, depobj) {
	this.dependencies[url] = depobj 
}

Renderer.prototype.render = function (url) {
	var self = this;
	return this._render(url).then(function () {
		c('all dependencies:');
		for (dep in self.dependencies) {
			c(dep + ' : ' + i(self.dependencies[dep]));
		}
	});
}

Renderer.prototype._render = function (url) {
	var p = new mod_promise.Promise()
		, self = this

	//c('render...');

	self.loadResource(url).then(function (resource){
		if (!resource instanceof mod_resources.Resource) { throw new Error('wrong type'); }
		//c('resource ' + resource.data.toString());


		self.parse(resource).then(function (renderres) { 
			if (!renderres instanceof mod_resources.RenderedViewResource) { throw new Error('wrong type'); }
			//c(i(renderres))
			var r = [];

			//c('after parse ' + url + ';' + i(parsed));

			depsdone = {};
			if (renderres && renderres.elements) {
				renderres.elements.forEach(function (item) {
					c('checking elements')
					if (getModule(item.moduleId)/*getModule impl always returns true currently*/) {
						var viewurl = getViewUrl(item.moduleId, 'main');
						//c(viewurl);
						if (!depsdone[viewurl]) {
							r.push(self._render(viewurl));	
						} else {
							c('do not add again ' + viewurl);
						}
						depsdone[viewurl] = true;
					} else {
						throw new Error('module not found');
					}
				});

				mod_promise.all(r).then(function (all) {
					c('resolved all sub-renders ' + url)
					//c(i(all));
					p.resolve(renderres);	
				});
			} else {
				c('no subviews for ' + url)
				p.resolve(renderres);
			}
		});
	});

	return p;
}

Renderer.prototype.parse = function (resource) {
	var p = new mod_promise.Promise()
		, self = this
		, url = resource.url;
	//c('parse url ' + url + ' ...');
	parseHtmlView(resource, self.tagmanager).then(function (renderres) {
		//var data = urls[url] && urls[url].dependencies ? urls[url].dependencies : {css:[]};
		//c('done parsing ' + url + ','/* + i(data)*/);
		//self.addDependency(url, data);
		p.resolve(renderres);
	});
	return p;
}

Renderer.prototype.loadResource = function (url) {
	return mod_resourcemanager.getResource(url);
}

exports.Renderer = Renderer;



//run();
function run() {
	var rndr = new Renderer({});
	c(i(rndr))
	rndr.render('foo.html').then(function () {
		//c('done')
	})
};

function getViewUrl(moduleid, viewname) {
	return 'file://' + require('path')
			.join(__dirname
					, '..'
					, 'modules'
					, moduleid
					, 'htdocs'
					, viewname ? viewname + '.html' : 'main.html'
			);
}																	

// [TBD] will ask the module factory
function getModule (modulename) {
	return true;
}

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