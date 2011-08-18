"use strict";

/** 
 * This module provides functions for rewriting CSS stylesheet in a way that they are effectively
 * shielded from their environment and can thus be aggregated without interfering each other. 
 *
 * Please note: 
 * 
 * Due to the fact the @imports must be at the start of a file, aggregated CSS files received from 
 * the resource service include non-functional import directives if more than one file used import. 
 . Do not use @import, link to individual files instead. This will be changed in the future by 
 * adopting it resources. 
 * 
 * When writing your CSS, adhere to 
 * 
 */

var mod_path            = require('path')
    , crypto            = require('crypto')
    , c                 = console.log

/** 
 * Takes a local CSS file of a web component with component-relative URLs and transforms it into
 * a component host specfic format by rewriting URLs to the host, and by prefixing CSS rules with 
 * a random class selector, that 'shields' them from the environment. 
 * 
 * Does not change fully-qualified http:// URLs. 
 *
 * Warning: the algorithm is not very clever and requires rules selectors to occupy a complete
 * line, starting with the selector in column 1 and ending with the open bracket of the rule. 
 *
 * You will be able to use webcomponent:// URLs, currently not implemented. 
 * 
 * @param {String} data CSS data
 * @param {String} path root path 
 * @return {String} rendered CSS data
 * @public
 */
function render (data, path, url) { 
    data = data.split(/\n/);

    c('the path ' + path  + ',url ' + url);

    var hash = crypto.createHash('md5');
    hash.update(path);
    var prefix = hash.digest('hex');
    
    var data = data.map(function (line) {
        if (line.match(/url\(/)) {
            if (line.indexOf('http://') !== -1) {
                return line;
            } else if (line.indexOf('webcomponent://') !== -1) {
                throw new Error('not implemented');
            } else {
                return  line.replace(/url\(['"]?(.*?)['"]?\)/, function () { return rewriteUrl(url, arguments[1]); } );
            }
        } else if (line.indexOf('@import') === 0) {

            return line.replace(/url\(['"]?(.*?)['"]?\)/, function () { return rewriteUrl(url, arguments[1]); } );
        } else if (line.indexOf('{') > -1) {
            // var ii = line.indexOf(' ');
            // var firstSel = line.substring(0, ii);
            // if (line.indexOf('#') === 0) {   
            //  return '#' + prefix + '-' + firstSel.substring(1) +  line.substring(ii);
            // } else if (line.indexOf('.') === 0) {
            //  return '.' + prefix + firstSel + ' ' + line.substring(ii);
            // } else {
            //  return firstSel + '.' + prefix +  line.substring(ii);
            // }
        }

        return line;
    });
    return data.join('\n');
}

function rewriteUrl (url, match) {
    var s = 'file://' + mod_path.join(__dirname, '..');
    var p = url.substring(s.length, url.lastIndexOf('/'));
    return 'url(\"' + mod_path.join(p, match) + '\")' 
}

exports.render = render;