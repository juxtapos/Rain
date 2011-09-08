var mod_fs          = require('fs')  
  , mod_sys         = require('sys')
  , mod_path        = require('path')
  , logger          = require('../logger.js').getLogger(mod_path.basename(__filename))
  , redback         = require('redback')
  , socketio        = require('socket.io')
  , utils           = require('./utils');

mod_fs.readFile(__dirname+'/../../conf/mothership.conf.default', function (err, data) {
  if (err) {
      logger.error('error reading server configuration');
      process.exit();
  }
  
  var configServer = JSON.parse(data);
  
  if(!configServer.redis){
    throw logger.error("You must define redis server configuration!");
  }
  logger.info('server configuration loaded');
  
  //make server configuration global
  global.Server = {
      conf : configServer
  };
  
  global.R = redback.createClient(configServer.redis.port, configServer.redis.host);
  logger.info('Connected to Redis');
  
  global.IO = socketio.listen(configServer.server.port);
  logger.info('Listening to port: '+configServer.server.port);
  
  var channels = require('./channels.js');
  
  IO.sockets.on('connection', function(socket){
    /**
     * TODO
     * 1. remove the server from redis
 DONE* 2. publish it to the other server
     */
    socket.on('disconnect', function(){
      socket.get('server_uuid', function (err, server_uuid) {
        socket.broadcast.emit('ms.server_disconnected', server_uuid);
        logger.info("broadcasting - ms.server_disconnected");
      });
    });
    
    /**
     * TODO
     *
 DONE* 1. create new uuid for the new node server
     * 2. register it to the redis rain registry
 DONE* 3. return it to the node server
 DONE* 4. publish the new node server to all other node server
     */
    var server_uuid = utils.createUUID();
    socket.set('server_uuid', server_uuid, function(){
      socket.emit('server.registered', server_uuid, function(success){
        if(success){
          console.log("connection and registration successful established with server: "+server_uuid);
          socket.broadcast.emit('new server registered', server_uuid);
        } else {
          logger.warn("Server has a problem to confirm registration!");
          //TODO: what happens now?
        }
      })
    });
  });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  logger.info('Mothership started');
});