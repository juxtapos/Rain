var mod_promise 			= require('promised-io')
	, sys 				= require('sys')
	, logger        	= require('./logger.js').getLogger('TagManager')
	, mod_tagmanager	= require('./tagmanager.js')

	, c 	= console.log
	, i 	= sys.inspect


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

function Dependencies() {
	
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

	c('render...');

	self.loadResource(url).then(function (resource){

		c('resource ' + i(resource));

		self.parse(url).then(function (parsed) { 
			var r = [];

			c('after parse ' + url + ';' + i(parsed));

			//if (parsed.css) parsed.css.forEach(function (item) { self.dependencies.push(item); });
			//if (parsed.css) parsed.forEach(function (item) { self.dependencies.push(item); });


			if (parsed && parsed.urls) {
				parsed.urls.forEach(function (item) {
					if (urls[item]) {
						//r.push(new Renderer({}).render(item));
						r.push(self._render(item));
					}
				});

				mod_promise.all(r).then(function (all) {
					c('resolved all sub-renders ' + url)
					c(i(all));
					p.resolve(parsed);	
				});
			} else {
				c('no subviews for ' + url)
				p.resolve([parsed]);
			}
		});
	});

	return p;
}

Renderer.prototype.parse = function (url) {
	var p = new mod_promise.Promise(),
		self = this;
	c('parse url ' + url + ' ...');
	setTimeout(function () {
		var data = urls[url] && urls[url].dependencies ? urls[url].dependencies : {css:[]};
		c('done parsing ' + url + ','/* + i(data)*/);
		self.addDependency(url, data);
		p.resolve(data);
	}, Math.random()*100);
	return p;
}

Renderer.prototype.loadResource = function (url) {
	var p = new mod_promise.Promise();
	c('loadResource ' + url + ' ...');
	setTimeout(function () {
		c('resource ' + url + ' loaded');
		p.resolve();
	}, Math.random()*100);
	return p;
}





run();
function run() {
	var rndr = new Renderer({});
	c(i(rndr))
	rndr.render('foo.html').then(function () {
		c('done')
	})
};


















function parseHtmlView (url, doc, tagmanager, mode) {
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