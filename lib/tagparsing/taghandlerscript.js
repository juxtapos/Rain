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
 * Module used to implement a script tag handler. This is also
 * responsible for extracting client side controller from this tag.
 */

var mod_taghandler 	  = require("./taghandler"),
mod_logger        = require('../logger'), 
logger            = mod_logger.getLogger('TagHandlerLink', mod_logger.Logger.SEVERITY.INFO);

exports.TagHandlerScript = TagHandlerScript;

function TagHandlerScript(prefix, tag, attributes, body, componentcontainer) {
	this.prefix = prefix;
	this.tag = tag;
	this.attributes = attributes;
	this.body = body;
	this.componentcontainer = componentcontainer;
}

TagHandlerScript.prototype = new mod_taghandler.TagHandler(this.tag, this.attributes, this.body);
TagHandlerScript.prototype.constructor = TagHandlerScript;

TagHandlerScript.prototype.handleTag = function() {
	logger.info("Rendering tag " + this.tag + ", attributes " + this.attributes);
	
	var attrsHash = {};
	
	var clientcontroller, scriptresource;
	
    this.attributes.forEach(function (item) { attrsHash[item[0]] = item[1]; } );

    if (attrsHash['type'] === 'client-view-controller' && attrsHash['src']) {
        clientcontroller = attrsHash['src'];
    } else if (attrsHash['src']) {
        scriptresource = attrsHash['src'];
    }
    
    return {"scriptresource" : scriptresource,
    		"clientcontroller" : clientcontroller};
};