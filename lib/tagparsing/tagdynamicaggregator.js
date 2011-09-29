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
 * This module is used to implement a handler for tag dynamic-aggregator. 
 * This tag is extremely useful for creating dashboards or pages that
 * modify their content dynamically when new views are added to RAIN. 
 *
 * @author Radu Viorel Cosnita
 */

var mod_promise     		= require('promised-io/promise'),
	mod_taghandler			= require("./taghandler"),
	mod_logger        		= require('../logger'), 
	mod_tagfactory			= require("./tagfactory"),
	mod_renderer			= require("../renderer"),
	mod_path				= require("path"),
	logger            		= mod_logger.getLogger('TagDynamicAggregator', mod_logger.Logger.SEVERITY.INFO);

exports.TagDynamicAggregator = TagDynamicAggregator;

function TagDynamicAggregator(prefix, tag, attributes, body, componentcontainer) {
	this.prefix = prefix;
	this.tag = tag;
	this.attributes = attributes;
	this.body = body;
	this.componentcontainer = componentcontainer;	
}

/**
 * Method used to obtain a dictionary with each key being the name of
 * the nested tag from an array of dictionaries.
 */
function _buildBodyMap(bodyArray) {
	var bodyMap = {};
	
	for(var i in bodyArray) {
		for(var j in bodyArray[i]) {
			var key = j;
			
			bodyMap[key] = {};
			
			bodyArray[i][key].forEach(function(item) {
				bodyMap[key][item[0]] = item[1];
			});			
		}		
	}
	
	return bodyMap;
}

/**
 * Method used to obtain the markup for a specified view config.
 * 
 * It output the markup inside a specified renderTag.
 * 
 * @param {Dictionary} viewConfig The configuration
 * @param {ComponentContainer} componentcontainer
 */
function _buildMarkupForView(viewConfig, componentcontainer) {
	var markup = [];
	
	var viewpath = mod_path.join(viewConfig.moduleUrl, viewConfig.view);
		
	var tagFactory = new mod_tagfactory.TagFactory(componentcontainer); 
	
	var componentid  = componentcontainer.getComponentByRequestPath(viewpath),
    component = componentcontainer.createComponent(componentid);
    component.initialize(viewConfig.view, "html", {}, /*this,*/ 
    			undefined, undefined, undefined, 
    			tagFactory);
	
    var defer = new mod_promise.defer();        
    
    component.once("rendered", function(component) {
		var renderer = component.renderer;
		
		markup.push(renderer.renderresult.content);
		
		var ret = {};
		
		ret.markup = markup.join("");
		
		if(renderer.renderresult.dependencies.script) {
			ret.scriptresource = renderer.renderresult.dependencies.script;
		}

		if(renderer.renderresult.dependencies.css) {
			ret.cssresource = renderer.renderresult.dependencies.css;
		}
		
		
		defer.resolve(ret);
    });
    
    return defer.promise;
}

TagDynamicAggregator.prototype = mod_taghandler.TagHandler;
TagDynamicAggregator.prototype.constructor = TagDynamicAggregator;

/**
 * This tag always accept a body so we want the parser to render it
 * onEndElement instead of onStartElement.
 * 
 * @returns {Boolean}
 */
TagDynamicAggregator.prototype.isTagRemoved = function() {
	return false;
};

/**
 * Here we implement the code for rendering text of this tag.
 * 
 * @param {String} innerText
 * @example 
 * 		<!-- the custom markup -->
 *   	<dynamic-aggregator>
 *			<filter value="type=dashboard" />
 *			<grid cols="2" />
 *			<renderdTag value="widget" />
 *		</dynamic-aggregator>
 *
 *		<!-- will render an html table similar to -->
 *		<table>
 *			<tr>
 *				<td><widget>[view html markup]</widget></td>
 *				<td><widget>[view html markup]</widget></td>
 *			</tr>
 *
 *			<tr>
 *				<td><widget>[view html markup]</widget></td>
 *				<td><widget>[view html markup]</widget></td>
 *			</tr>
 *		</table>
 */
TagDynamicAggregator.prototype.getTagPreprocessed = function(innerText) {
	var bodyMap = _buildBodyMap(this.body);
	
	var filter = bodyMap.filter.value;
	var gridCols = bodyMap.grid.cols || 1;
	var renderTag = bodyMap.renderTag.value;
	
	var scriptresource = [];
	var cssresource = [];
		
	var viewConfigItems = this.componentcontainer.getViewsByFilter(filter); 
	
	var fullMarkup = ["<table>"];
	var currCol = 0;
		
	var defer = new mod_promise.defer();
	var resolvedViews = 0;
	
	for(var i in viewConfigItems) {
		var viewConfig = viewConfigItems[i];
			
		var currPromise = _buildMarkupForView(viewConfig,  this.componentcontainer);
						
		currPromise.then(function(viewresult) {
			var startBodyPos = viewresult.markup.indexOf("<body>");
			var endBodyPos = viewresult.markup.indexOf("</body>");
				
			if(currCol % gridCols == 0) {
				if(currCol > 0) {
					fullMarkup.push("</tr>");
					
					currCol = 0;
				}
				
				fullMarkup.push("<tr>");
			}

			currCol ++;					
			
			fullMarkup.push("<td>");
			
			fullMarkup.push("<" + renderTag + ">");
			fullMarkup.push(viewresult.markup.substring(startBodyPos + 6, endBodyPos).trim());			
			fullMarkup.push("</" + renderTag + ">");
			
			fullMarkup.push("</td>");
			
			if(viewresult.scriptresource) { 
				scriptresource = scriptresource.concat(viewresult.scriptresource);
			}
			
			if(viewresult.cssresource) {
				cssresource = cssresource.concat(viewresult.cssresource);
			}
			
			logger.info(cssresource);
			
			if(++resolvedViews == viewConfigItems.length) {
				if(fullMarkup[fullMarkup.length - 1] != "</tr>") {
					fullMarkup.push("</tr>");
				}
				
				fullMarkup.push("</table>");
				
				defer.resolve(
						{"markup" : fullMarkup.join("\r\n"),
						 "scriptresource" : scriptresource,
						 "cssresource" : cssresource});
			}			
		});		
	}
		
	return defer.promise;	
};