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
 * The Tag Manager handles the mappings between CSS selectors on view templates and web components. 
 * 
 * Todos:
 * 
 */
var mod_path          = require('path')
    , logger          = require('./logger.js').getLogger(mod_path.basename(module.filename));

function TagManager(taglist) {

    var taglist = taglist || [];

    this.addTag = function (tag) {
        taglist.push(tag);
    }

    this.removeTag = function (id) {
      var namespace = id.substring(0, id.indexOf('|'))
          , selector = id.substring(id.indexOf('|') + 1)
          c(namespace+','+selector)
        for (var i = 0; i < taglist.length; i++) {
            if (taglist[i].namespace == namespace && taglist[i].selector == selector) {
              //taglist = taglist.splice(i);
              taglist = taglist.slice(0, i).concat(taglist.slice(i+1));

            }
        }
    }

    this.getTagByModule = function (module) {
      var tag = null;
      for (var i = 0; i < taglist.length; i++) {
          if (taglist[i].module == module) {
              tag = taglist[i];
              break;
          }
      }
      return tag;
    }

    this.setTagList = function (tags) {
        taglist = tags
    }

    this.getTagList = function () {
        return taglist;
    }

  /** 
   * [TBD] This code sucks big time... 
   * I need to organize tags more efficiently to get rid of this ugly and buggy piece of code. 
   * Sizzle could be used, but it's most probably way too slow.
   * 
   * Todos: 
   * - find best match, selectors with predicates must be ranked higher
   * - more than one module my map to a single element
   * - anyways: check performance of sizzle engine + creating a document. this shit needs to be FAST.
   */
  this.getTag = function (elem, attrs, prefix, uri, namespaces) {
    //logger.debug(JSON.stringify(arguments));
    for (var i = 0, tag = null; i < taglist.length; i++) {
      tag = taglist[i];
      if (uri !== null && tag.namespace != '' && tag.namespace != uri) {
        //logger.debug('tag has namespace, but no match'); 
        continue;
      }

      var si = tag.selector.indexOf('[');
      if (si !== -1) {
        var tagelem = tag.selector.substring(0, si),
            preds = {},
            ps, 
            attrh = {};
        ps = tag.selector.substring(si).split(']').forEach(function (val) {
          if (val === '') return;
          preds[val.substring(1, val.indexOf('='))] = val.substring(val.indexOf('=') + 1);
        });
        for (var j = 0; j < attrs.length; j++) {
          attrh[attrs[j][0]] = attrs[j][1];
        }
      } else {
        var tagelem = tag.selector;
      }

      var fe = true;
      if (tagelem !== elem && tagelem !== '*') {
        //logger.debug('element name not matched');
        fe = false;
        continue;
      }

      var fp = true
      if (si !== -1) {
        var count = 0;
        for (var pred in preds) {
          //logger.debug('pred ' + pred + ". " + attrh[pred] + "," + preds[pred]);
          if (attrh[pred] !== preds[pred]) {
            fp = false;
            //logger.debug('attribute val not mached');
            break;
          }
          count++;
        }
        if (count -1 >= j) {
          fp = false;
          //logger.debug('matched not all predicates');  
          break;
        }
      }

      if (!fp) {
        //logger.debug('attrs not matched');
        continue;
      }
      if (!fe) {
        //logger.debug('selector not matched');
        continue;
      }

      //logger.debug('matching tag ' + tag.selector);
      return tag;
    }

    return null;
  }
}

exports.TagManager = TagManager;