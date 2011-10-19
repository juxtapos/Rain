var mod_fs          = require('fs')  
  , mod_sys         = require('sys')
  , mod_path        = require('path')
  , logger          = require('../logger').getLogger(mod_path.basename(__filename))
  , socketio        = require('socket.io')
  , utils           = require('./utils')
  , datastore       = require('./datastore/redis.js');

module.exports = function(configServer, callback){

  if(!configServer.datastore){
    throw logger.error("You must define datastore server configuration!");
  }
  logger.info('mothership configuration loaded');
  
  //make server configuration global
  global.Server = {
      conf : configServer
  };
  
  datastore = new datastore(configServer.datastore);
  
  global.IO = socketio.listen(configServer.server.port);
  logger.info('Listening to port: '+configServer.server.port);
  
//  var channels = require('./channels.js');
  
  IO.sockets.on('connection', function(socket){
    /**
     * 
     * 1. remove the server from redis
     * 2. publish it to the other server
     */
    socket.on('disconnect', function(){
      socket.get('server_uuid', function (err, server_uuid) {
        datastore.removeServerComponents(server_uuid, function(){
          socket.broadcast.emit('mothership/server/components/remove', server_uuid);
        });
        datastore.removeServer(server_uuid, function(){
          socket.broadcast.emit('mothership/server/disconnect', server_uuid);
          logger.info("broadcasting - mothership/server/disconnect");
        });
      });
    });
    
    /**
     * 
     *
     * 1. create new uuid for the new node server
     * 2. register it to the redis rain registry
     * 3. return it to the node server
     * 4. publish the new node server to all other node server
     */
    
    socket.on('mothership/server/register/successful', function(server_port){
      if(server_port){
        socket.get('server_uuid', function (err, server_uuid) {
          datastore.addServer(server_uuid, socket.handshake.address.address+':'+server_port, function(){
            console.log("connection and registration successful established with server: "+server_uuid);
            socket.broadcast.emit('mothership/server/connect', JSON.stringify({
              server_uuid : server_uuid,
              address : socket.handshake.address.address+':'+server_port
            }));
          });
        });
      } else {
        logger.warn("Server has a problem to confirm registration!");
        //TODO: what happens now?
      }
    });
    
    /**
     * COMPONENT HANDLING START
     * 
     * 1. server meldet seine components
     * 2. ms registriert diese und speichert sie ins datastore
     * 3. führt nen broadcast zu allen anderen servern mit den aktuellen informationen
     */
    
    socket.on('mothership/server/components/registration', function(components){
      socket.get('server_uuid', function (err, server_uuid) {
        datastore.addServerComponents(server_uuid, components, function(){
          console.log('server components added to datastorage');
          datastore.getAllComponents(function(allComponents){
            socket.emit('mothership/server/components/all', JSON.stringify(allComponents));
            socket.broadcast.emit('mothership/server/components/new', JSON.stringify({
              server_uuid : server_uuid,
              components : components
            }));
          });
        });
      });
    });
    
    /**
     * COMPONENT HANDLING END
     */    
    
    /**
     * SESSION HANDLING START
     */
    socket.on('mothership/server/session/update', function(session){
      if(session){
        datastore.updateSession(JSON.parse(session), function(){
          console.log("session updated for server: "+server_uuid);
        });
      }
    });
    
    socket.on('mothership/server/session/delete', function(session_id){
      if(session){
        datastore.removeSession(session_id, function(){
          console.log("session deleted for server: "+server_uuid);
        });
      }
    });
    
    /**
     * SESSION HANDLING ENDS
     */
    
    var server_uuid = utils.createUUID();
    socket.set('server_uuid', server_uuid, function(){
      socket.emit('mothership/server/register', server_uuid);
    });
  });
  
  logger.info('Mothership started');
  if(callback)
    callback();
}