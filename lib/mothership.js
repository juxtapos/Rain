var mod_fs          = require('fs')  
  , mod_sys         = require('sys')
  , mod_path        = require('path')
  , logger          = require('./logger.js').getLogger(mod_path.basename(__filename))
  , redback         = require('redback')
  , socketio        = require('socket.io');

mod_fs.readFile(__dirname+'/../conf/mothership.conf.default', function (err, data) {
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
  
  logger.info('Mothership started');
});


function initEvents(){
  var channel = R.createChannel("registry");
  
} 