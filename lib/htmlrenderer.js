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
    if (typeof d.script[0] != 'undefined') {
        depmarkup.push('\t\t<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                 , encodeURIComponent(d.script.join(';')), '"></script>\n');
    }

    var dm = createControllerInitialization(renderer, modulecontainer);
    depmarkup.push(dm);

    if (doc.indexOf('<style') > -1) {
        doc = doc.substring(0, doc.indexOf('<style')) + depmarkup.join('') + doc.substring(doc.indexOf('<style'));
    } else {
        doc = doc.substring(0, doc.indexOf('</head>')) + depmarkup.join('') + doc.substring(doc.indexOf('</head>'));
    }

    return doc;
}

function createControllerInitialization (renderer, modulecontainer) {
    var markup = [];
    walk(renderer);
    var frag = markup.join('');
    return frag.length ? '<script type="application/javascript">\n' + frag + '</script>\n' : '';
        
    function walk(renderer) {
        var dep = '',
            eid = renderer.element && renderer.element.id ? renderer.element.id : null,
            selector,
            clientcontroller;
        
        

        // client-side controller priority: 1. defined in component meta, 2. defined inline via <script> element
        var moduleconfig = renderer.component.config;
        var viewconfigitem = modulecontainer.getViewConfigItem(renderer.url, moduleconfig);
        if (viewconfigitem && viewconfigitem.controller) {
            clientcontroller = mod_path.join(moduleconfig.url, viewconfigitem.controller);
        } else if (renderer.renderresult.clientcontroller) {
            clientcontroller = renderer.renderresult.clientcontroller;
        }
        if (clientcontroller) {
            if (!eid) {
                eid = 'body';
            } else {
                eid = '#' + eid;
            }
            console.log(renderer.instanceId);
            var properties = {
                renderer_id : renderer.uuid
                ,domId : renderer.instanceIdMap.domId
                ,instanceId : renderer.instanceIdMap.instanceId
                ,clientcontroller : clientcontroller
                ,domselector : renderer.eid
            };
            markup.push('var c = window.Raintime.ComponentRegistry.register(' + JSON.stringify(properties) + ');\n');
            if (renderer.parentrenderer) {
                markup.push('c.addParent("' + renderer.parentrenderer.uuid + '");\n');    
            }
            selector = renderer.parentrenderer ? '#' + renderer.element.id : 'body';
            var compParams = JSON.stringify(renderer.component.params);
            //markup.push('require(["' + clientcontroller + '"' + dep + '], function (controller) {\n');
            //markup.push('\t/*$("' + selector + '").css("border", "1px solid red");*/ /*controller.init("' + eid + '", JSON.parse(\'' + compParams + '\'));*/ } );');
        } else {
            logger.debug('no client-side controller found for ' + renderer.uuid);
        }

        renderer.childrenderers.forEach(function (renderer) {
            walk(renderer);
        });
    }
}

exports.HTMLRenderer = HTMLRenderer