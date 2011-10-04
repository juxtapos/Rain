var   sys          = require('sys')
    , EventEmitter = require('events').EventEmitter;


function Datastore(properties){
  this.init(properties);
};

sys.inherits(Datastore, EventEmitter);

Datastore.prototype.init = function(properties){
  throw "function init -> must be implement";
};

Datastore.prototype.removeServer = function(server_uuid, callback){
  throw "function removeServer -> must be implement";
};

Datastore.prototype.addServer = function(server_uuid, address, callback){
  throw "function addServer -> must be implement";
};

Datastore.prototype.updateSession = function(session, callback){
  throw "function updateSession -> must be implement";
};

Datastore.prototype.removeSession = function(session_id, callback){
  throw "function removeSession -> must be implement";
};

exports = module.exports = Datastore;