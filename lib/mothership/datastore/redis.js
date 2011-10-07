var   sys          = require('sys')
    , ds_interface = require('./datastore_interface')
    , mod_path     = require('path')
    , logger       = require('../../logger').getLogger(mod_path.basename(__filename))
    , redback      = require('redback');

function RedisDatastore(datastore_conf){
  this.init(datastore_conf);
};

sys.inherits(RedisDatastore, ds_interface);

RedisDatastore.prototype.init = function(datastore_conf){
  this.R = redback.createClient(datastore_conf.port, datastore_conf.host);
  this.__session_hash = this.R.createHash('rain.session');
  this.__registry = this.R.createHash('rain.registry.server');
  this.__components = this.R.createHash('rain.registry.components');
  logger.info('Connected to Redis');
};

RedisDatastore.prototype.removeServer = function(server_uuid, callback){
  this.__registry.del(server_uuid, callback);
};

RedisDatastore.prototype.addServer = function(server_uuid, address, callback){
  this.__registry.set(server_uuid, address, callback);
};

RedisDatastore.prototype.updateSession = function(session, callback){
  this.__session_hash.set(session.sid, JSON.stringify(session.data), callback);
};

RedisDatastore.prototype.removeSession = function(session_id, callback){
  this.__session_hash.del(session_id, callback);
};


RedisDatastore.prototype.addServerComponents = function(server_uuid, components, callback){
  this.__components.set(server_uuid, components, callback);
};

RedisDatastore.prototype.getAllComponents = function(callback){
  this.__components.get(function(status, components){
    callback(components);
  });
};

RedisDatastore.prototype.removeServerComponents = function(server_uuid, callback){
  this.__components.del(server_uuid, callback);
};



exports = module.exports = RedisDatastore;