/*
Copyright (c) 2011, Mitko Tschimev <privat@mitko-tschimev.de>
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

/**
 * Don't use strict because we use eval() which is not available in strict mode.
 */

var gettext       = require('gettext')
    , mod_path    = require('path')
    , sys         = require('sys')
    , mod_events  = require('events')
    , node_xml    = require('node-xml')
    , logger      = require('./logger.js').getLogger(mod_path.basename(module.filename))
    , default_language = Server.conf.default_language;

function TranslationManager(module, language, domain){
  mod_events.EventEmitter.call(this);
  
  this.__htdocs = null;
  this.__module = module;
  this.__language = language || default_language;
  this.__domain = domain;
  this.__gettext = gettext;
  this.__state = this.STATES.INIT;
  
  this.init();
}

sys.inherits(TranslationManager, mod_events.EventEmitter);

TranslationManager.prototype.STATES = {
  INIT          : 0
  , LOADING     : 2 
  , LOADED      : 3
  , NO_LOCALES  : 4
};

  
TranslationManager.prototype.init = function(){
  this.__state = this.STATES.LOADING;
  var self = this;
  this.emit('stateChanged', this.__state);
  this.__htdocs = mod_path.join(Server.root, this.__module.url, '/htdocs');
  var locales = this.__htdocs+'/locales/';
  mod_path.exists(locales, function(exists){
    if(exists){
      gettext.loadLocaleDirectory(locales, function(){
        self.__state = self.STATES.LOADED;
        self.emit('stateChanged', self.__state);
        logger.debug('translation locales loaded: ' + self.getResource());
      });
    } else {
      self.__state = self.STATES.NO_LOCALES;
      self.emit('stateChanged', self.__state);
    }
  }); 
  
  gettext.setlocale('LC_ALL', this.__language);
  gettext.textdomain = this.__domain || 'messages';
};

TranslationManager.prototype.getResource = function(){
  return this.__htdocs;
};
    
TranslationManager.prototype.getLocale = function(){
  return this.__language;
};

TranslationManager.prototype.parseTemplateAsXML = function(template, callback){
  var self = this;
  
  var parser = new node_xml.SaxParser(function(cb) {
    var html = '',
        elements = {},
        level = 0,
        uuidGettextAttr = 0,
        gettextAttrs= {};
    
    cb.onStartDocument(function() {

    });
    cb.onEndDocument(function() {
      html = html.replace(/\$\{\{([0-9]+)\}\}\$/g, function(matched, uuid){
        return gettextAttrs[uuid] ? " data-gettext='"+gettextAttrs[uuid]+"'": '';
      });
      callback(html);
    });
    cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
      level++;
      var messages = [];
      
      html += '<'+elem;
      
      element = elem;
      for(var i = attrs.length; i--;){
        var attr = attrs[i],
            attr_name=attr[0],
            attr_content=attr[1];
        
        if(~attr_content.indexOf('getmedia')){
          attr_content = attr_content.replace(/(getmedia\([^\)]*\))/g, function(media_function){
            return eval("self."+media_function);
          });
        }
        if(~attr_content.indexOf('gettext')){
          attr_content = attr_content.replace(/([a-z]*gettext\([^\)]*\))/g, function(translation_function){
            var trans = self.getTranslation(translation_function);
            var message = self.extractTranslationArguments(trans[0]);
            message.attr = attr_name;
            message.fallback = trans[1];
            message.locale = trans[2];
            messages.push(message);
            return trans[0].translation;
          });
        }
        html += ' '+attr_name+'="'+attr_content+'"';
      }
      
      html += "${{"+uuidGettextAttr+"}}$";
      
      html += ">";
      elements[level] = {
          messages : messages,
          uuid : uuidGettextAttr++
      };
    });
    cb.onEndElementNS(function(elem, prefix, uri) {
      var props = elements[level];
      if(props){
        var messages = props.messages || [];
        if(messages.length > 0)
          gettextAttrs[props.uuid] = JSON.stringify({
            localepath : self.__module.url+"/htdocs/locales/",
            messages : messages
          });
      }
      
      html += '</'+elem+'>';
      level--;
    });
    cb.onCharacters(function(chars) {
      var messages = [],
          props = elements[level];
      if(props && props.messages)
        messages = props.messages;
      if(~chars.indexOf('gettext')){
        chars = chars.replace(/([a-z]*gettext\([^\)]*\))/g, function(translation_function){
          var trans = self.getTranslation(translation_function);
          var message = self.extractTranslationArguments(trans[0]);
          message.fallback = trans[1];
          message.locale = trans[2];
          messages.push(message);
          return trans[0].translation;
        });
      }
      
      if(props)
        props.messages = messages;
      
      html += chars;
    });
    cb.onCdata(function(cdata) {});
    cb.onComment(function(msg) {});
    cb.onWarning(function(msg) {});
    cb.onError(function(msg) {});
  });

  parser.parseString(template);
};

TranslationManager.prototype.extractTranslationArguments = function(translationObject){
	var args = translationObject.args;
	var message = {};
	
	if(args[0])
		message.domain = args[0];
	if(args[1])
		message.msgctxt = args[1];
	if(args[2])
		message.msgid = args[2];
	if(args[3])
		message.msgid_plural = args[3];
	if(args[4])
		message.number = args[4];
	
// not in use yet
//	if(args[5])
//		message.category = args[5];
	
	return message;
};

TranslationManager.prototype.getTranslation = function(translation_function){
  translation_function = 'gettext.'+translation_function;
  var translation = eval(translation_function);
  if (!translation.args) return [translation, true];
  if(translation.args[2] == translation.translation || translation.args[3] == translation.translation){
    if(this.getLocale() == default_language)
      //return the msgid, cause there exist no translation
      return [translation, true, 'no_TRANSLATION'];
    
    gettext.setlocale('LC_ALL', default_language);
    translation = eval(translation_function);
    gettext.setlocale('LC_ALL', this.getLocale());
    if(translation.args[2] == translation.translation || translation.args[3] == translation.translation){
      //return the msgid, cause there exist no translation
      return [translation, true, 'no_TRANSLATION'];
    }
    //return the translation in default_language with the fallback logic
    return [translation, true, default_language];
  }
  //return the translation with the given locale
  return [translation, false, this.getLocale()];
};

TranslationManager.prototype.getMedia = TranslationManager.prototype.getmedia = function(src, language){
  var lang = language || this.getLocale();
  
  return this.__module.url+"/htdocs/media/"+lang+'_'+src;
};

module.exports = TranslationManager;