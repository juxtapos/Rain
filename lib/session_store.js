
/*!
 * Connect - session - RainSessionStore
 * Mitko Tschimev
 * 
 * uses MemoryStore and RedisStore as backup
 */

/**
 * Module dependencies.
 */

var Store = require('../node_modules/connect/lib/middleware/session/store')
  , utils = require('../node_modules/connect/lib/utils')
  , Session = require('../node_modules/connect/lib/middleware/session/session');

/**
 * Initialize a new `RainSessionStore`.
 *
 * @api public
 */

var RainSessionStore = module.exports = function RainSessionStore(socketclient) {
  this.sessions = {};
  this.socketclient = socketclient;
};

/**
 * Inherit from `Store.prototype`.
 */

RainSessionStore.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

RainSessionStore.prototype.get = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    var expires
      , sess = self.sessions[sid];
    if (sess) {
      sess = JSON.parse(sess);
      expires = 'string' == typeof sess.cookie.expires
        ? new Date(sess.cookie.expires)
        : sess.cookie.expires;
      if (!expires || new Date < expires) {
        fn(null, sess);
      } else {
        self.destroy(sid, fn);
      }
    } else {
      fn();
    }
  });
};

/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

RainSessionStore.prototype.set = function(sid, sess, fn){
  var self = this;
  process.nextTick(function(){
    var json_str = JSON.stringify(sess);
    self.sessions[sid] = json_str;
    self.socketclient.emit('session.update', { sid : sid, data : json_str});
    fn && fn();
  });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

RainSessionStore.prototype.destroy = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    delete self.sessions[sid];
    self.socketclient.emit('session.delete', sid);
    fn && fn();
  });
};

/**
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * @api public
 */

RainSessionStore.prototype.all = function(fn){
  var arr = []
    , keys = Object.keys(this.sessions);
  for (var i = 0, len = keys.length; i < len; ++i) {
    arr.push(this.sessions[keys[i]]);
  }
  fn(null, arr);
};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

RainSessionStore.prototype.clear = function(fn){
  this.sessions = {};
  fn && fn();
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

RainSessionStore.prototype.length = function(fn){
  fn(null, Object.keys(this.sessions).length);
};
