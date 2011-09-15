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

/**
 * This module is used to implement a handler for custom hyperlink. For instance
 * to custom hyperlinks forms are supported:
 * 
 * 1: <a href="webcomponent://moduleId/viewId">Bla bla bla</a>
 * 2: <a href="webcomponent://moduleId/viewId">
 * 		<param control="<control_id>" value-method="[optional javascript method name]" />
 * 		<param control="<control_id>" value-method="[optional javascript method name]" />
 * 	  </a>
 * 
 * @author Radu Viorel Cosnita
 */

"use strict";

var mod_taghandler			= require("./taghandler"),
	mod_logger				= require('../logger'),
	mod_componentcontainer	= require("../componentcontainer"),
	logger					= mod_logger.getLogger('TagHandlerHyperlink', mod_logger.Logger.SEVERITY.INFO);

function TagHandlerHyperlink(prefix, tag, attributes, body) {
	this.prefix = prefix;
	this.tag = tag;
	this.attributes = attributes;
	this.body = body;	
}

function handleTag() {
	logger.info("Rendering link " + this.tag + ", with attributes " + this.attributes);
	
	var attrsHash = {};
	
	this.attributes.forEach(function(item) {
		attrsHash[item[0]] = item[1];
	});
		
	var compContainer = mod_componentcontainer.getCurrentComponentContainer();
	
	if(!attrsHash.href || attrsHash.href.indexOf("webcomponent://") == -1) {
		return;
	}
	 
	var href = attrsHash.href.replace("webcomponent://", "");	
	var moduleId = href.slice(0, href.indexOf("/"));
	var viewId = href.slice(href.indexOf("/") + 1);
	
	var moduleConfig = compContainer.getConfiguration(moduleId);
	
	href = compContainer.getViewUrlByViewId(moduleConfig, viewId);
	
	this.attributes.forEach(function(item) {
		if(item[0] == "href") {
			item[1] = href; 
		}
	});
}

function isTagRemoved() {
	return false;
}

TagHandlerHyperlink.prototype = new mod_taghandler.TagHandler(this.tag, this.attributes, this.body);
TagHandlerHyperlink.prototype.constructor = TagHandlerHyperlink;
TagHandlerHyperlink.prototype.handleTag = handleTag;
TagHandlerHyperlink.prototype.isTagRemoved = isTagRemoved;

exports.TagHandlerHyperlink = TagHandlerHyperlink;
