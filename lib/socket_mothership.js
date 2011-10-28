var io         = require('socket.io-client/lib/socket.io-client')
    , mod_path = require('path')
    , logger   = require('./logger.js').getLogger(mod_path.basename(module.filename))
    , client   = null
    , components = null;

exports.init = function(properties){
  
  Server.registeredServer = {};
  Server.peer2peerRelation = {};

  if(properties){
    if(properties.components)
      components = properties.components;
  }
  
  client = new io.connect(Server.conf.mothership.host, {
    port: Server.conf.mothership.port
  });
  
  client.on('connect', function(){
    logger.info("Connected to mothership!");
  });

  client.on('disconnect', function(){
    logger.info("Disconnected from mothership!");
  });
  
  client.on('mothership/server/register', function(server_uuid){
    global.Server.UUID = server_uuid;
    client.emit('mothership/server/register/successful', Server.conf.server.port);
    if(components)
      client.emit('mothership/server/components/registration', JSON.stringify(components));
  });
  
  client.on('mothership/server/components/all', function(data){
    global.Server.registeredServer = JSON.parse(data);
  });
  
  client.on('mothership/server/components/new', function(data){
    data = JSON.parse(data);
    Server.registeredServer[data.server_uuid] = data.components;
  });
  
  client.on('mothership/server/components/remove', function(server_uuid){
    delete Server.registeredServer[server_uuid];
  });
  
  client.on('mothership/server/disconnect', function(server_uuid){
    delete Server.peer2peerRelation[server_uuid];
  });
  
  client.on('mothership/server/connect', function(data){
    data = JSON.parse(data);
    Server.peer2peerRelation[data.server_uuid] = data.address;
  });
  
  exports.client = client;
};