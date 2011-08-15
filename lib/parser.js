"use strict";

var mod_promise     = require('promised-io')
    , mod_xml       = require('node-xml')
    , mod_path      = require('path')
    , logger        = require('./logger.js').getLogger(mod_path.basename(module.filename))

function parseHtmlView (data, url, tagmanager) {
    var defer               = new mod_promise.defer()
        //, url               = resource.url
        , parser            = new mod_xml.SaxParser(new DocParser())

        // these are filled by the parser and returned to the caller 
        , elements          = [] // web components used by view, in parse order
        , outputBuffer      = []
        , cssresources      = [] // css resources used by view, in document order
        , scriptresources   = [] // javasript resources used by view, in document order
        , textresources     = [] // javasript resources used by view, in document order

    parser.parseString(data);
    return defer.promise;

    function DocParser() {
        var tagRemoved = false;

        return function (cb) {
            cb.onStartDocument(function() {
                //console.log('onStartDocument');  
            });

            cb.onEndDocument(function() {
                //console.log(elements);
                defer.resolve({
                                'elements'          : elements,
                                'dependencies'    : {
                                    'css'       : cssresources,
                                    'script'    : scriptresources,
                                    'locale'    : textresources    
                                }
                                , 'document'        : outputBuffer.join('')
                }); 
            });

            cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                //sys.puts("=====> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
                var instanceid
                    , viewname

                //
                // a document should not be transformed in parser. 
                // reminder to refactor to new render transformer
                // 
                // [TBD] should do namespace check for all elements
                // [TBD] should check for type attr in link element
                if (elem === 'link') {
                    attrs.forEach(function (item) {
                        if (item[0] === 'href') {
                            cssresources.push(item[1]);
                            tagRemoved = true;
                        }
                    });
                // [TBD] should check for type attr? 
                } else if (elem == 'script') {
                    attrs.forEach(function (item) {
                        if (item[0] === 'src') {
                            scriptresources.push(item[1]);
                            tagRemoved = true;
                        }
                    });
                // [TBD] don't assume a prefix
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


//
// should probably only handle a minimum and hand out all attributes to the renderer
//
                        for (var i = 0; i < attrs.length; i++) {
                            if (attrs[i][0] === 'instanceid') {
                                instanceid = attrs[i][1];
                                continue;
                            }
                            if (attrs[i][0] === 'view') {
                                viewname = attrs[i][1];
                                continue;
                            }
                        }
                        var eid = addId(attrs);
                        var elemResource = {
                            'id'            : eid 
                            , 'instanceid'  : instanceid
                            , 'view'        : viewname
                            , 'tag'         : tag
                            , 'attrs'       : attrs
                            // [TBD] the renderer should receive a copy of the elements he was invoked by. 
                            /*, 'node' : {
                                elem : elem
                                , attrs : attrs
                                , prefix : prefix
                                , uri : uri
                                , namespace
                            }*/
                        };
                        elements.push(elemResource);

                        //
                        // UGLY ALARM!
                        //
                        var hash = require('crypto').createHash('md5');
                        hash.update(tag.module);
                        var id = hash.digest('hex');
                        attrs.push(['class', id]);
                    }
                }

                if (!tagRemoved) {
                    outputBuffer = outputBuffer.concat(copyStartTag(elem, attrs, prefix, uri, namespaces));
                    if (tag) {
                        outputBuffer.push('{{{thing' + eid + '}}}');
                    }
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

exports.parseHtmlView = parseHtmlView;