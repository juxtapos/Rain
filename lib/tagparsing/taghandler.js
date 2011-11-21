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

"use strict";

/**
 * This module provide API for a tag handler that is supported by
 * RAIN parser.
 */

var logger = require("../logger");

exports.TagHandler = TagHandler;

/**
 * Body will be available only when we have nested tags.
 * 
 * @param {String} prefix
 * @param {String} tag
 * @param {Dictionary} attributes
 * @param {Array} body it will be a list of dictionary like [{tagname : {}, ...]
 * @returns {TagHandler}
 */
function TagHandler(prefix, tag, attributes, body, componentcontainer) {
	this.prefix = prefix;
	this.tag = tag;
	this.attributes = attributes;
	this.body = body;
	this.componentcontainer = componentcontainer;
}

/**
 * This is the method that extracts all information from the tag. If we need
 * to collect some data from handling process of the tag we assign a
 * collector function that receives one parameter: data.
 *
 */
TagHandler.prototype.handleTag = function() {

};

/**
 * This method is used for telling parser if the tag is completely removed 
 * after handler is executed or not.
 * 
 * @return
 */
TagHandler.prototype.isTagRemoved = function() {
	return true;
};

/**
 * Method used to obtain markup of a tag with nested body.
 * 
 * @param {String} innerText The text collected from the tag.
 */
TagHandler.prototype.getTagPreprocessed = function(innerText) {
	return undefined;
};