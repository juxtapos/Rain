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
    , logger      = require('./logger.js');    

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
};

  
TranslationManager.prototype.init = function(module, language, domain){
  this.__language = language = language || 'en_US';
  this.__gettext = gettext;
  this.__state = this.STATES.LOADING;
  var self = this;
  this.emit('stateChanged', this.__state);
  this.__resource = mod_path.join(__dirname, '..', module.url, '/htdocs/locales/');
  gettext.loadLocaleDirectory(this.__resource, function(){
    self.__state = self.STATES.LOADED;
    self.emit('stateChanged', self.__state);
  });
  
  gettext.setlocale('LC_ALL', language);
  gettext.textdomain = domain || 'messages';
}

TranslationManager.prototype.getResource = function(){
  return this.__resource;
};
    
TranslationManager.prototype.getLocale = function(){
  return this.__language;
};

TranslationManager.prototype.translateTemplate = function(template){
  template = template.replace(/([a-z]*gettext.*\))/g, function(a, b, c, d){
    return eval('gettext.'+a);
  });
  
  //TODO: make it ready for orgasm <:O_
  /**
   * regexp for elements like <title></title>
   * result:
   * 
   *    $1: tagname
   *    $2: tag attribution content as string
   *    
   *    
   * Regular expression code: <([^<][a-z]+?)>gettext\(\s*['|"]([^'"]*)['|"]\s*\)<[^<]+?>
   */
  
  /**
   * regexp for elements like <img />
   * result:
   * 
   *    $1: tagname
   *    $2: tag attribution content as string
   *    
   */    
   // Regular expression code: <([^<][a-z]+)\s*(.*(?:.*getmedia.*|.*gettext.*))\s*/>
  
  return template;
};

module.exports = TranslationManager;