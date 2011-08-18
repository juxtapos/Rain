"use strict";

var mod_promise     = require('promised-io/lib/promise')
    , mod_xml       = require('node-xml')
    , mod_path      = require('path')
    , logger        = require('./logger.js').getLogger(mod_path.basename(module.filename))

function parseHtmlView (data, url, tagmanager) {
    var defer               = new mod_promise.defer()
        //, url               = resource.url
        , parser            = new mod_xml.SaxParser(new DocParser())

        // these are filled by the parser and returned to the caller 
        , elements          = []        // web components used by view, in parse order
        , outputBuffer      = []
        , cssresources      = []        // css resources used by view, in document order
        , scriptresources   = []        // javasript resources used by view, in document order
        , textresources     = []        // javasript resources used by view, in document order
        , controller        = null      // view template's client-side controller script

    parser.parseString(data);
    return defer.promise;

    function DocParser() {
        var tagRemoved = false;

        return function (cb) {
            cb.onStartDocument(function() {
            });

            cb.onEndDocument(function() {
                defer.resolve({
                    'elements'      : elements,
                    'controller'    : controller,
                    'document'      : outputBuffer.join(''),
                    'dependencies'  : {
                        'css'           : cssresources,
                        'script'        : scriptresources,
                        'locale'        : textresources    
                    }
                }); 
            });

            cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                var instanceid
                    , viewname

                // [TBD] a document should not be transformed in parser. 
                // [TBD] should do namespace check for all elements
                // [TBD] should check for type attr in link element
                var attrsHash = {};
                if (elem === 'link') {
                    attrs.forEach(function (item) { attrsHash[item[0]] = item[1]; } );
                    if (attrsHash['href'] && attrsHash['rel'] == 'stylesheet') {
                        cssresources.push(attrsHash['href']);
                        tagRemoved = true;
                    }
                } else if (elem == 'script') {
                    attrs.forEach(function (item) { attrsHash[item[0]] = item[1]; } );
                    if (attrsHash['type'] === 'client-view-controller' && attrsHash['src']) {
                        controller = attrsHash['src'];
                        tagRemoved = true;
                    } else if (attrsHash['src']) {
                        scriptresources.push(attrsHash['src']);
                        tagRemoved = true;
                    }
                // [TBD] don't assume a prefix
                } else if (elem == 'text' && prefix === 'tx') {
                    attrs.forEach(function (item) { attrsHash[item[0]] = item[1]; } );
                    textresources.push(attrsHash['key']);
                } else {
                    var tag = tagmanager.getTag(elem, attrs, prefix, uri, namespaces);
                    if (tag !== null) {
                        //logger.debug('found tag ' + tag.selector);
                        attrs.forEach(function (item) { attrsHash[item[0]] = item[1]; } );
                        instanceid = attrsHash['instanceid'];
                        viewname = attrsHash['view'];
                        var eid = addId(attrs);
                        var elemResource = {
                            'id'            : eid 
                            , 'instanceid'  : instanceid
                            , 'view'        : viewname
                            , 'tag'         : tag
                            , 'attrs'       : attrs
                        };
                        elements.push(elemResource);

                        //
                        // UGLY ALARM!
                        // [TBD] wire up with CSS resource service
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
            cb.onComment(function (chars) {
                outputBuffer.push('<!--', chars, '-->');
            });

            function copy(chars) {
                outputBuffer.push(chars);
            };

            cb.onWarning(function(msg) {
                logger.warn('warning ' + msg);
            });

            cb.onError(function(msg) {
                logger.error('parse error in line ' + parser.getLineNumber() + ' in resource ' + url + ',' + JSON.stringify(msg));
                // no mercy tonight!
                defer.resolve({});
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