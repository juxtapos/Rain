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

/**
 * Don't use strict because we use eval() which is not available in strict mode.
 */

var gettext       = require('gettext')
    , mod_path    = require('path')
    , sys         = require('sys')
    , mod_events  = require('events')
    , logger      = require('./logger.js').getLogger(mod_path.basename(module.filename));

function TranslationManager(module, language, domain){
  mod_events.EventEmitter.call(this);
  
  this.__resource = null;
  this.__language = null;
  this.__gettext = null;
  this.__state = this.STATES.INIT;
  
  this.init(module, language, domain);
}

sys.inherits(TranslationManager, mod_events.EventEmitter);

TranslationManager.prototype.STATES = {
  INIT          : 0
  , LOADING     : 2 
  , LOADED      : 3
  , NO_LOCALES  : 4
};

  
TranslationManager.prototype.init = function(module, language, domain){
  this.__language = language = language || 'en_US';
  this.__gettext = gettext;
  this.__state = this.STATES.LOADING;
  var self = this;
  this.emit('stateChanged', this.__state);
  this.__resource = mod_path.join(__dirname, '..', module.url, '/htdocs/locales/');
  mod_path.exists(this.__resource, function(exists){
    if(exists){
      gettext.loadLocaleDirectory(self.__resource, function(){
        self.__state = self.STATES.LOADED;
        self.emit('stateChanged', self.__state);
        logger.debug('translation locales loaded: ' + self.getResource());
      });
    } else {
      self.__state = self.STATES.NO_LOCALES;
      self.emit('stateChanged', self.__state);
    }
  }); 
  
  gettext.setlocale('LC_ALL', language);
  gettext.textdomain = domain || 'messages';
};

TranslationManager.prototype.getResource = function(){
  return this.__resource;
};
    
TranslationManager.prototype.getLocale = function(){
  return this.__language;
};

TranslationManager.prototype.translateTemplate = function(template){
  var self = this;
  //TODO: make it ready for orgasm <:O_
  
  /**
   * regexp for elements like <title></title>
   * result:
   * 
   *    $1: tagname
   *    $2: tag attribution content as string
   *    $3: tagcontent
   *    
   *    
   */
  // Regular expression code: <([a-z]+)\s*(.*getmedia[^\/>]*|.*gettext[^\/>]*)*\s*>(.*getmedia.*|.*gettext.*)*<\s*\/.+>
  template = template.replace(/<([a-z]+)\s*(.*getmedia[^\/>]*|.*gettext\([^\/>]*)*\s*>(.*getmedia.*|.*gettext\(.*)*<\s*\/.+>/g, function(matchstring, tagname, attributes, tagcontent){
	  return self.parseRegexp(tagname, attributes, tagcontent);
  });
  

  /**
   * regexp for elements like <img />
   * result:
   * 
   *    $1: tagname
   *    $2: tag attribution content as string
   *    $3: <tag /> than matched / else NO MATCH
   *    
   */    
   // Regular expression code: <\s*([a-z]+)\s*(.*(?:.*getmedia[^/>]*|.*gettext[^/>]*))\s*(\/)?\s*>(?:.*<\s*/.+>)?
  template = template.replace(/<\s*([a-z]+)\s*(.*(?:.*getmedia[^\/>]*|.*gettext\([^\/>]*))\s*(\/)?\s*>(?:.*<\s*\/.+>)?/g, function(matchstring, tagname, attributes, closed){
	  return self.parseRegexp(tagname, attributes, null, closed);
  });
  
  return template;
};

TranslationManager.prototype.parseRegexp = function(tagname, attributes, tagcontent, closed){
	var html = '',
		self = this,
		messages = [];
	html += '<'+tagname;
	
	if(attributes){
		html += attributes.replace(/([a-z-]*)=['"]((?:getmedia[^"]*|[^"]*gettext\([^"]*)*)['"]/g, function(foobar, attrname, functionstr){
			var trans = eval('gettext.'+functionstr);
			if(typeof trans == 'object'){
			  var message = self.extractTranslationArguments(trans);
	      message.attr = attrname;
	      messages.push(message);
	      return attrname+'="'+trans.translation+'"';
			}
			return trans;
		});
	}
	
	var contentStr = '';
	if(tagcontent){
		contentStr = tagcontent.replace(/([a-z]*gettext\([^\)]*\))/g, function(foobar, functionstr){
			var trans = eval('gettext.'+functionstr);
			if(typeof trans == 'object'){
			  var message = self.extractTranslationArguments(trans);
	      messages.push(message);
	      return trans.translation;
      }
			return trans;
		});
	}
	if(messages.length > 0)
		html += " data-gettext='"+JSON.stringify({
			localepath : this.getResource(),
			messages : messages
		})+"'";
	html += '>'+contentStr+'</'+tagname+'>';
	
	return html;
};

TranslationManager.prototype.extractTranslationArguments = function(translationObject){
	var args = translationObject.args;
	var message = {};
	
	//d, msgctxt, msgid, msgid_plural, n, category
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
//	if(args[5])
//		message.category = args[5];
	
	return message;
}

module.exports = TranslationManager;