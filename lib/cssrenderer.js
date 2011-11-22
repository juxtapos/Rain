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
    , less              = require('less')
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
function render (data, module, url) { 
    data = data.split(/\n/);
   
    var hash = crypto.createHash('md5');
    hash.update(module.url);
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
    
    less.render('.'+(module.id.replace(/[:;\.]/g, '_'))+' { '+data.join('\n')+' }', function(error, css){
      if(error){
        error.filename = url;
        c(error);
        throw "CSS parsing error!";
      } else {
        data = css;
      }
    });
    return data;
}

function rewriteUrl (url, match) {
    var s = 'file://' + Server.conf.server.documentRoot;
    var p = url.substring(s.length, url.lastIndexOf('/'));
    return 'url(\"' + mod_path.join(p, match) + '\")';
}

exports.render = render;