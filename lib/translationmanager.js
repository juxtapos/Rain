/**
 * NO use strict cause we need eval() 
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