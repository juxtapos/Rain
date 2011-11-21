/*
Copyright (c) 2011, Radu Viorel Cosnita <radu.cosnita@1and1.ro>

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

exports.TagHandlerHyperlink = TagHandlerHyperlink;

function TagHandlerHyperlink(prefix, tag, attributes, body, componentcontainer) {
	this.prefix = prefix;
	this.tag = tag;
	this.attributes = attributes;
	this.body = body;	
	this.componentcontainer = componentcontainer;
}

/**
 * Method used to generate a js valid statement that can obtain the value 
 * of the specified control.
 * 
 * @param control The control id / name (if formname is specified than this is control name).
 * @param formName (Optional) form name under which input is defined
 * @param valueMethod (Optional) valueMethod to execute on the input.
 * 
 * @returns A valid js for obtaining the control value from page.
 */
function _obtainJsInputValueGet(control, formName, valueMethod) {
	var jsControlRef = "";
	
	if(formName) {
		jsControlRef = "document.forms." + formName + "." + control;
	}
	else {
		jsControlRef = "document.getElementById('" + control + "')";
	}
	
	if(valueMethod) {
		if(valueMethod.substring(valueMethod.length - 1) == ";") {
			valueMethod = valueMethod.substring(0, valueMethod.length - 1);
			
			logger.info(valueMethod);
		}
		
		valueMethod = valueMethod.replace("this.", jsControlRef + ".");
	}
	else {
		valueMethod = "value";
	}
	
	return "var " + control + "=" + jsControlRef + "." + valueMethod + ";";
}

TagHandlerHyperlink.prototype = new mod_taghandler.TagHandler(this.tag, this.attributes, this.body);
TagHandlerHyperlink.prototype.constructor = TagHandlerHyperlink;

TagHandlerHyperlink.prototype.handleTag = function() {
	logger.info("Rendering link " + this.tag + ", with attributes " + this.attributes);
	
	var attrsHash = {};
	
	this.attributes.forEach(function(item) {
		attrsHash[item[0]] = item[1];
	});
		
	var compContainer = this.componentcontainer;
	
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
};

TagHandlerHyperlink.prototype.isTagRemoved = function() {
	return false;
};

/**
 * For hyperlinks we process params nested tags as well as
 * attributes.
 * 
 * @param {String} innerText The static text collected by parser. 
 */
TagHandlerHyperlink.prototype.getTagPreprocessed = function(innerText) {
	this.handleTag();
	
	logger.info("Adding nested body content.");
	
	var attrsHash = {};
	
	this.attributes.forEach(function(item) {
		attrsHash[item[0]] = item[1];
	});
	
	attrsHash.onclick = "";
	
	var paramsHref = "";
		
	for(var i in this.body) {
		var param = this.body[i];
		
		if(!param.param) {
			continue;
		}
		
		var paramAttrs = {};
		
		param.param.forEach(function(item) {
			paramAttrs[item[0]] = item[1];
		});
		
		attrsHash.onclick += _obtainJsInputValueGet(paramAttrs.control, paramAttrs.form, paramAttrs["value-method"]);

		paramsHref += paramAttrs.control + "=' + " + paramAttrs.control;
		
		if(i < this.body.length - 1) {		
			paramsHref += "+'&";
		}
	}
		
	attrsHash.onclick += "window.location = '" + attrsHash.href + "?" + paramsHref;

	if(this.body.length > 0) {
		return "<a href='#' onclick=\"" + attrsHash.onclick + "\">" + innerText.trim() + "</a>";
	}
	else {
		return "<a href='" + attrsHash.href + "'>" + innerText.trim() + "</a>";
	}
};