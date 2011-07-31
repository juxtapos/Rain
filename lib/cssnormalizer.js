/** 
 * This module normalizes URLs in CSS files provided by modules to absolute paths
 * that are valid on an individual module host. 
 * 
 */

var mod_path			= require('path')
	mod_assert			= require('assert')
 	 , c 				= console.log

/** 
 * Normalizes a URL in a CSS file. Does not change fully-qualified http:// URLs. 
 * 
 * @param {String} data CSS data
 * @param {String} path root path 
 * @param {String} orighost URL of old source host
 * @param {String} newhost URL of new source host
 * @return {String} normalized CSS data
 * @public
 */
function normalize(data, path, orighost, newhost) {
	var data = data.replace(/url\(['"]?([^'"\)']+)['"]?\)?/mg, function () {
		var p;
		if (arguments[1].indexOf('http://') === 0) { return arguments[1]; }
		p = mod_path.join(path, arguments[1]); 
		if (orighost !== newhost) { p = newhost + p; }
		p = 'url(\"' + p + '\")';
		return p;
 	});
 	return data;
}

exports.normalize = normalize;