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
 * Logger module. 
 * Has appenders for console and HTTP. 
 *
 */

function Logger(name, level) {
    if ('undefined' === typeof name) { name = '' }
    this.appender = [ new ConsoleAppender() ]; // yes, I know... 
    this.name = name;
    this.level = level;
}
Logger.SEVERITY = {
    INFO  : 5,
    DEBUG : 4,
    WARN  : 3,
    ERROR : 2
}

//
// [TBD] add argument style and join 
//
Logger.prototype.info = function (msg) {
  this._log(msg, Logger.SEVERITY.INFO);
}
Logger.prototype.debug = function (msg) {
  this._log(msg, Logger.SEVERITY.DEBUG);
}
Logger.prototype.warn = function (msg) {
  this._log(msg, Logger.SEVERITY.WARN);
}
Logger.prototype.error = function (msg) {
  this._log(msg, Logger.SEVERITY.ERROR);
}
Logger.prototype._log = function (msg, level) {
  if (level > this.level) { return; }
  for (var i = this.appender.length; --i >= 0;) {
    this.appender[i].append(msg, this.name, level);
  }
}

function ConsoleAppender () {
}
ConsoleAppender.prototype.append = function (msg, logger, level) {
    var col = level == 2 || level == 3 ? '\033[31m' : '\033[32m',
        msg = logger != '' ? (col + logger + ':\033[39m ' + msg ) : msg
    // there's no console.debug, map debug to console.info
    var lvls = {'5':'info', '4':'info', '3':'warn', '2' :'error'};
    console[lvls[level]](msg);
}

function HttpLogHostAppender (url) {  
    var opts = parseUri(url);
    this.options = {
        host: opts.host,
        port: opts.port,
        path: opts.path,
        method: 'POST',
        headers : {
            "Content-Type" : "application/json"
        }
    }; 
}
HttpLogHostAppender.prototype.append = function (msg, logger, level) {
    var req = http.request(this.options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {});
    });
    var data = {};
    data.msg = msg;
    data.origin = logger;
    data.timestamp = new Date().getTime();
    try {
        req.write(JSON.stringify(data));    
    } catch (error) {
        // JSON.stringify does not allow circular references, so we need to 
        // catch that here
    }
    req.end();
}

var defaultLogLevel = 10;

function getLogger (name, level) {
    var l = typeof level !== 'undefined' ? level : defaultLogLevel;
    return new Logger(name, l);
}

exports.getLogger       = getLogger;
exports.Logger          = Logger;
exports.defaultLogLevel = defaultLogLevel;