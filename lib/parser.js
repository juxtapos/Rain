/*
Copyright (c) 2011, Claus Augusti <claus@formatvorlage.de>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

"use strict";

var mod_promise     = require('promised-io/lib/promise')
    , mod_xml       = require('node-xml')
    , mod_path      = require('path')
    , logger        = require('./logger.js').getLogger(mod_path.basename(module.filename))
    , openelems     = { 
                        'area' : 1, 
                        'base' : 1, 
                        'basefont' : 1, 
                        'br' : 1, 
                        'col' : 1, 
                        'frame' : 1, 
                        'hr' : 1, 
                        'img' : 1, 
                        'input' : 1, 
                        'isindex' : 1, 
                        'link' : 1, 
                        'meta' : 1, 
                        'param' : 1 
                      }
    , uuid_parser = 1;

function parseHtmlView (data, url, tagmanager, tagFactory) {
    var defer               = new mod_promise.defer()
        //, url               = resource.url
        , parser            = new mod_xml.SaxParser(new DocParser())

        // grab content from tag element
        , insideElement         = null  // the fully-qualified element of an open tag element
        , elementContentIndex   = null  // index of tag element content in outputBuffer
        , lastEvent             = null  // used to decide if an element needs a closing tag 

        // these are filled by the parser and returned to the caller 
        , elements          = []        // web components used by view, in parse order
        , outputBuffer      = []
        , cssresources      = []        // css resources used by view, in document order
        , scriptresources   = []        // javasript resources used by view, in document order
        , textresources     = []        // javasript resources used by view, in document order
        , clientcontroller  = null      // view template's client-side controller script
        , elementContent    = null
        , tag               = null;

    parser.parseString(data);

    return defer.promise;

    /**
     * Method used to extract all required data from tag handler:
     * 
     * cssresources, scriptresources, textresources, clientcontroller and so on.
     */
    function collectDataFromTagFactory(data) {
    	logger.info(JSON.stringify(data));
    	
    	if(data.cssresource && data.cssresource.length > 0) {    		
    		if(!(data.cssreource instanceof Array)) {
    			cssresources.push(data.cssresource);
    		}
    		else {
    			cssresources.concat(data.cssresource);
    		}
    	}
    	else if(data.clientcontroller) {
    		clientcontroller = data.clientcontroller;
    	}
    	else if(data.scriptresource && data.scriptresource.length > 0) {
    		if(!(data.scriptresource instanceof Array)) {
    			scriptresources.push(data.scriptresource);
    		}
    		else {
    			scriptresources.concat(data.scriptresource);
    		}
    	}
    }    
    
    function DocParser() {
        var tagRemoved = false,
            tmpElement = null, 
            parentTagName,
            openedTags = {};
        
        var currentTagThreads = 0;

        /**
         * Method used to end the current parser. 
         * 
         * @param {Promise} defer
         */
        function completeParsing(defer) {
            defer.resolve({
                'elements'          : elements,
                'clientcontroller'  : clientcontroller,
                'document'          : outputBuffer.join(''),
                'dependencies'      : {
                    'css'               : cssresources,
                    'script'            : scriptresources,
                    'locale'            : textresources    
                }
            });        	
        }
        
        return function (cb) {       	
            cb.onStartDocument(function() {
                outputBuffer.push('<!DOCTYPE html>');
            });

            cb.onEndDocument(function() {
            	if(currentTagThreads == 0) {
            		completeParsing(defer);
            	}
            });

            cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                var instanceid,
                    viewname,
                    attrsHash = {};

                tag = null;
                tagRemoved = false;
                               
                if (!insideElement) {
                	if(tagFactory.isTagSupported(elem, undefined, attrs) && 
                			!tagFactory.isBodyExpectedForTag(elem)) {
                		tagRemoved = tagFactory.handleTag(prefix, elem, attrs, collectDataFromTagFactory);
                	}
                	else if(tagFactory.isTagSupported(elem, undefined, attrs)) {
                		currentTagThreads ++;
                		
                		if(JSON.stringify(openedTags) == "{}") {
                			parentTagName = elem;
                			openedTags[elem] = {"attributes"	: attrs,
                								"text"			: "",
                								"childs"		: []};
                		}
                	}
                	else if(parentTagName) {
                		var child = {};
                		child[elem] = attrs;
                		
                		openedTags[parentTagName].childs.push(child);
                	}
                	else {
                        tag = tagmanager.getTag(elem, attrs, prefix, uri, namespaces);
                        if (tag !== null) {
                            //logger.debug('found tag ' + tag.selector);
                            attrs.forEach(function (item) { attrsHash[item[0]] = item[1]; } );
                            instanceid = attrsHash['instanceid'];
                            viewname = attrsHash['view'];
                            
                            var eid = addId(attrs);
                            
                            
                            
                            /*
                             * ======BEGIN======
                             * overwrite all attributes and replace wrapper tag with an div and the class namespace
                             */
                            attrs.push(['class', 'app_container '+tag.module.replace(/[:;\.]/g, '_')]);
                            
                            //======END======
                            
                            var elemResource = {
                                'id'                : eid,
                                'instanceid'        : instanceid,
                                'view'              : viewname,
                                'tag'               : tag,
                                'attrs'             : attrs,
                                'elementContent'    : null,
                                'tmpElement'        : true    //if true than the start end end tag will be replaced with an div
                            };
                            elements.push(elemResource);
                            insideElement = uri + ':' + elem;
                        }
                    }
                }

                if (!tagRemoved && JSON.stringify(openedTags) == "{}") {
                    if(elemResource && elemResource.tmpElement){
                      outputBuffer = outputBuffer.concat(copyStartTag('div', attrs, prefix, uri, namespaces));
                    } 
                    else {
                      outputBuffer = outputBuffer.concat(copyStartTag(elem, attrs, prefix, uri, namespaces));
                    }
                }
//                addId(attrs);  ?????????????????

                if (insideElement && !elementContentIndex) {
                    elementContentIndex = outputBuffer.length;
                }

                lastEvent = 'startelementns';
            });

            cb.onEndElementNS(function(elem, prefix, uri) {
            	//logger.info(JSON.stringify(openedTags));
            	 
            	// here we handle the case when a complex tag with 
            	// nested body is closed.            	
            	if(elem == parentTagName) {
            		var attrs = openedTags[parentTagName].attributes;
            		var body = openedTags[parentTagName].childs;
            		var innerText = openedTags[parentTagName].text;
            		var markup = tagFactory.handleTagWithBody(prefix, elem, attrs, body, innerText);            		
            		
            		if(!(markup.then)) {
            			currentTagThreads --;
            			outputBuffer.push(markup);
            		}
            		else {
            			// A taghandler handleWithTagBody method can return two value: 
            			// a string representation or a Promise instance.
            			var currPos = outputBuffer.length;
            			
            			markup.then(function(result) {
            				outputBuffer.splice(currPos, 0, result.markup);
            				collectDataFromTagFactory(result);         
            				currentTagThreads --;
            				
                        	if(currentTagThreads == 0) {                                 		
                        		completeParsing(defer);
                        	}
            			});
            		}
            		
            		delete openedTags[elem];
            		parentTagName = undefined;
            		return;
            	}            	
            	
            	if(parentTagName != undefined) {
            		return;
            	}
            	
                var tmpElement = false;
                
                if (insideElement == uri + ':' + elem) {
                    tmpElement = elements[elements.length - 1].tmpElement;
                    elements[elements.length - 1].elementContent = outputBuffer.slice(elementContentIndex).join('');
                    outputBuffer = outputBuffer.slice(0, elementContentIndex);
                    outputBuffer.push('{{{__render__', elements[elements.length-1].id, '}}}'/*, '</', (prefix ? prefix + ':' : ''), elem, '>'*/);
                    insideElement = null;
                    elementContentIndex = null;
                }
                if (!tagRemoved) { 
                    if (!openelems[elem]){
                      if(tmpElement){
                        outputBuffer.push("</", (prefix ? prefix + ":" : ""), 'div', ">");
                      } else {
                        outputBuffer.push("</", (prefix ? prefix + ":" : ""), elem, ">");
                      }
                    }
                }
                tagRemoved = false;
                lastEvent = 'endelementns';                
            });

            cb.onCharacters(function (chars) {         
                copy(chars);
                lastEvent = 'characters';
            });
            cb.onCdata(copy);
            cb.onComment(function (chars) {
                outputBuffer.push('<!--', chars, '-->');
            });

            function copy(chars) {
            	if(parentTagName) {
            		openedTags[parentTagName].text += chars;
            	}
            	else {
            		outputBuffer.push(chars);
            	}
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
    var eid = null
        // [TBD] use fixed format so file size is guaranteed on equal input and something less vulnerable... 
        // [TBD] this should ideally be globally unique to use this an identifier across system borders.  
        , elemId = Server.UUID+"_"+uuid_parser++;
    for (var j = 0, al = attrs.length, hasId = false; j < al; j++) {
        if (attrs[j][0] === "id") {
            eid = attrs[j][1];
            hasId = true;
        }
    }
    if (!hasId) {
        attrs.push(["id", elemId]);
        return elemId;
    } else {
        return eid;
    }
}

function copyStartTag(elem, attrs, prefix, uri, namespaces) {
    var outputBuffer = [];
    
    outputBuffer.push("<", (prefix ? prefix + ":" : ""), elem);
    if (namespaces.length > 0 || attrs.length > 0) {
        outputBuffer.push(" ");
    }
    for (var i = attrs.length; i--;) {
        outputBuffer.push(attrs[i][0], '="', attrs[i][1], '"');
        if (i > 0) { 
            outputBuffer.push(' '); 
        }
    }
    outputBuffer.push(['meta', 'link', 'br', 'img', 'input'].indexOf(elem) > -1 ? '/>' : '>');
    return outputBuffer;
}

exports.parseHtmlView = parseHtmlView;
