function getLogger (name) {
    return new Logger(name, Logger.SEVERITY.INFO);
}

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
    var col = level == 2 ? '\033[31m' : '\033[32m',
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

exports.getLogger = getLogger;