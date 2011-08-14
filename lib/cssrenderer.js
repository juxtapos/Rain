"use strict";

/** 
 * This module provides functions for rewriting CSS stylesheet in a way that they are effectively
 * shielded from their environment and can thus be aggregated without interfering each other. 
 * 
 */

var mod_path			= require('path')
	, crypto			= require('crypto')
	, c 				= console.log

/** 
 * Normalizes a URL in a CSS file. Does not change fully-qualified http:// URLs. 
 * Warning: the algorithm is not very clever and requires rules selectors to occupy a complete
 * line, starting with the selector in column 1 and ending with the open bracket of the rule. 
 * 
 * @param {String} data CSS data
 * @param {String} path root path 
 * @return {String} rendered CSS data
 * @public
 */
function render (data, path) { 
	data = data.split(/\n/);
	
	var hash = crypto.createHash('md5');
	hash.update(path);
	var prefix = hash.digest('hex');
	
	data = data.map(function (line) {
		if (line.match(/url\(/)) {
			if (line.indexOf('http://') !== -1) {
				return line;
			} else if (line.indexOf('modules://') !== -1) {
				return line
			} else {
				return  line.replace(/url\(['"]?(.*?)['"]?\)/, function () {
					return 'url(\"' + mod_path.join(path, arguments[1]) + '\")' 
				});
			}
		} else if (line.indexOf('@') === 0) {
			return line;
		} else if (line.indexOf('{') > -1) {
			// var ii = line.indexOf(' ');
			// var firstSel = line.substring(0, ii);
			// if (line.indexOf('#') === 0) {	
			// 	return '#' + prefix + '-' + firstSel.substring(1) +  line.substring(ii);
			// } else if (line.indexOf('.') === 0) {
			// 	return '.' + prefix + firstSel + ' ' + line.substring(ii);
			// } else {
			// 	return firstSel + '.' + prefix +  line.substring(ii);
			// }
		}

		return line;
	});
	return data.join('\n');
}

exports.render = render;