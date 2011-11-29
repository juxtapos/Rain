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

var mod_path            = require('path'),
    logger              = require('./logger.js').getLogger(mod_path.basename(module.filename)),
    mod_path            = require('path'),
    c                   = console.log

function HTMLRenderer() {}

HTMLRenderer.getViewBody = function (doc) {
    var m = doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi);
    return m && m[1] ? m[1] : '';
}

// [TBD] refactor to resource service
var RESOURCE_LOADER_URLPATH = "/resources?files";

HTMLRenderer.renderDocument = function (renderer, modulecontainer) {
    var doc         = renderer.renderresult.content,
        d           = renderer.renderresult.dependencies,
        depmarkup   = [];
    
    if (typeof d.css[0] != 'undefined') {
        depmarkup.push('\t\t<link rel="stylesheet" type="text/css" href="'
                 , RESOURCE_LOADER_URLPATH, '=', encodeURIComponent(d.css.join(';')), '"/>\n'); 
    }
        
    if(!d.script) {
    	d.script = [];
    }
    
    //add require-jquery.js always as first library!
    d.script.unshift("/components/core-components/htdocs/js/require-jquery.js");
    depmarkup.push('\t\t<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
             , encodeURIComponent(d.script.join(';')), '"></script>\n');
    
    //depmarkup.push('\t\t<script type="text/javascript" src=""></script>\n');
    depmarkup.push('\t\t<script type="text/javascript">\n'+createBootstrap(renderer)+'\n</script>\n');

    var scriptPosition = doc.search(/<script.*<\/head\*>/);
    if (scriptPosition > -1) {
        doc = doc.substring(0, scriptPosition) + depmarkup.join('') + doc.substring(scriptPosition);
    } else {
        doc = doc.substring(0, doc.indexOf('</head>')) + depmarkup.join('') + doc.substring(doc.indexOf('</head>'));
    }

    return doc;
};

function createBootstrap(renderer){

    var aliases = ['"core-components": "core-components/htdocs/js"'],
        getAliasFromComponent = function(parentRenderer){
            var componentid = parentRenderer.component.config.id
              , alias = '"'+componentid+'" : "'+componentid+'/htdocs/js"';
            
            var duplicate = false;
            for(var i = aliases.length; i--;){
                if(aliases[i] == alias){
                    duplicate = true;
                }
            }
            if(!duplicate){
                aliases.push(alias);
            }
            
            parentRenderer.childrenderers.forEach(function (childRenderer) {
                getAliasFromComponent(childRenderer);
            });
        };
    
    getAliasFromComponent(renderer);
    
    var bootstrapScript = 
    ['require({'
    ,'\t\t"debug": '+(Server.environment == 'production'? 'false' : 'true')+','
    ,'\t\t"baseUrl":"/components",'
    ,'\t\t"paths":{'
    ,aliases.join(',\n')
    ,'\t\t}'
    ,'});'
    ,'require(["core-components/raintime/raintime"]);'].join('\n');
    
    return bootstrapScript;
}

exports.HTMLRenderer = HTMLRenderer;
