/*
Copyright (c) 2011, Radu Viorel Cosnita <radu.cosnita@gmail.com>

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

/**
 * This module provide support for tag factories. Parser will use this tag factory
 * for correctly handling a specific tag.
 */

var mod_taghandlerlink 		= require("./taghandlerlink"),
	mod_taghandlerscript 	= require("./taghandlerscript"),
	mod_taghandlertext		= require("./taghandlertext"),
	mod_taghandlerhyperlink	= require("./taghandlerhyperlink"),
	mod_logger        		= require('../logger'), 
	logger            		= mod_logger.getLogger('TagFactory', mod_logger.Logger.SEVERITY.INFO);

function TagFactory() {	
	this.supportedTagHandlers = {
		"link"		: {"handler" : mod_taghandlerlink.TagHandlerLink,
					   "bodyExpected" : false},
		"script"	: {"handler" : mod_taghandlerscript.TagHandlerScript,
					   "bodyExpected" : false},
		"tx:text"	: {"handler" : mod_taghandlertext.TagHandlerText,
					   "bodyExpected" : false},
		"a"			: {"handler" : mod_taghandlerhyperlink.TagHandlerHyperlink,
					   "bodyExpected" : true}
	}; 	
}

/**
 * Method used to determine if a tag is supported by this factory
 * or not.
 * 
 * @param tag
 * @param prefix
 */
function isTagSupported(tag, prefix) {	
	var key = tag;
	
	if(prefix) {
		key = prefix + ":" + tag;
	}
	
	return this.supportedTagHandlers[key] ? true : false;
}

/**
 * Method used to determine if the tag is expected to have a body or not.
 */
function isBodyExpectedForTag(tag, prefix) {
	if(!this.isTagSupported(tag, prefix)) {
		return false;
	}
	
	var key = tag;
	
	if(prefix) {
		key = prefix + ":" + tag;
	}

	return this.supportedTagHandlers[key].bodyExpected;
}

/**
 * Method used to handle the tag.
 */
function handleTag(prefix, tag, attributes, fnCollector) {
	if(!this.isTagSupported(tag, prefix)) {
		throw new Error("Tag " + tag + " is not supported by tag factory.");
	}
	
	var handler = new this.supportedTagHandlers[tag].handler(prefix, tag, attributes);
	
	if(!fnCollector) {
		fnCollector = function(data) {};
	}
	
	var data = handler.handleTag();
	
	if(data) {
		fnCollector(data);
	}
	
	return handler.isTagRemoved();
}

/**
 * Method used to handle a tag with body. It returns the processed markup.
 * 
 * @param prefix
 * @param tag
 * @param attributes
 * @param body
 * @param innerText Inner text collected from tag.
 * @returns
 */
function handleTagWithBody(prefix, tag, attributes, body, innerText) {
	if(!this.isTagSupported(tag, prefix)) {
		throw new Error("Tag " + tag + " is not supported by tag factory.");
	}
	
	var handler = new this.supportedTagHandlers[tag].handler(prefix, tag, attributes, body);

	return handler.getTagPreprocessed(innerText);
}

TagFactory.prototype.isTagSupported = isTagSupported;
TagFactory.prototype.handleTag = handleTag;
TagFactory.prototype.isBodyExpectedForTag = isBodyExpectedForTag;
TagFactory.prototype.handleTagWithBody = handleTagWithBody;

var tagFactory = new TagFactory();

exports.TagFactory = tagFactory;