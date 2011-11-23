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

"use strict";

/**
 * Main server.
 * Handles a very simple kind of dependency injection, to be refactored to some service
 * registry ting. 
 * 
 */
 
    var mod_connect         = require('connect')
    , mod_sys               = require('sys')
    , mod_path              = require('path')
    , mod_resourceservice   = null
    , mod_resourcemanager   = null
    , mod_componentcontainer	= null
    , componentcontainer	= null
    , mod_cache             = require('./cache.js')
    , mod_socketio          = require('./socketio.js')
    , mod_socketmothership  = require('./socket_mothership')
    , mod_session_store     = require('./session_store')
    , socket_client         = null
    , mod_frontcontroller   = null
    , mod_fs                = require('fs')
    , cache                 = null
    , redisclient           = null
    , errorHandler          = null
    , sessionParser              = null
    , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))

    
module.exports = function (options, callback) { 
  // [TBD] dynamic configServer service (requires dependency management first)
          
  var configServer = null,
      configModules = null;  
  
  if (!options.conf) {
    logger.error('error reading server configuration');
    process.exit();
  }
  
  configServer = options.conf;
  
  if(!configServer.default_language){
    throw logger.error("You must define a default locale e.g. 'en_US' !");
  }
  
  configServer.server.serverRoot = mod_path.resolve(configServer.server.serverRoot);
  configServer.server.documentRoot = mod_path.resolve(configServer.server.documentRoot);
  configServer.server.componentPath = mod_path.resolve(configServer.server.componentPath);
  //make server configuration global
  global.Server = {
      conf : configServer,
      UUID : '',
      root : configServer.server.serverRoot
  };
  logger.info('server configuration loaded');
  configureServer(configServer);
  
  function configureServer (configServer) {
      mod_cache.configure(configServer);
      mod_resourcemanager     = require('./resourcemanager.js')(configServer, mod_cache);    
      mod_componentcontainer  = require('./componentcontainer.js');
      componentcontainer      = new mod_componentcontainer.ComponentContainer(mod_resourcemanager);        
      mod_resourceservice     = require('./resourceservice.js')(configServer, mod_resourcemanager, mod_cache, componentcontainer);
      mod_frontcontroller     = require('./frontcontroller.js')(mod_resourcemanager, componentcontainer);
      sessionParser                = require('./sessionParser');
      errorHandler            = require('./errorHandler.js')({
        showStack : true,
        showMessage : true,
        dumpExceptions : false
      });
      
    if (configServer.remotecontrol) {
        logger.info('setting up remote control');
        redisclient = require('./redisclient.js');
        redisclient.init(mod_tagmanager);
    }
    
    createServer(configServer);
    logger.info('server started on port ' + configServer.server.port + ', ' + new Date());
    callback();
  }
  
  function createServer(configServer) {
    
      //connect to mothership
      if (Server.conf.mothership && Server.conf.mothership.connect){
        mod_socketmothership.init({
          components : componentcontainer.componentMap
        });
        socket_client = mod_socketmothership.client;
      };
      var sessionStore = new mod_session_store(socket_client);
    
      var server = mod_connect.createServer(
          mod_connect.logger('dev')
          , mod_connect.favicon()
          , mod_connect.cookieParser()
          , mod_connect.session({ key : 'rain.sid', store : sessionStore, 
				secret: 'let it rain baby ;)',
				cookie: {path: "/", httpOnly: false}})
          , mod_connect.bodyParser()
          , mod_connect.query()
          , mod_connect.router(function (app) {
                app.get(/^\/.+\/([^\/]*)(\/htdocs\/.*\.html)$/,    mod_frontcontroller.handleViewRequest);            
                app.get(/^\/[^\/]+\/([^\/]*)\/controller\/(.*)$/,      mod_frontcontroller.handleControllerRequest);
                app.put(/^\/[^\/]\/([^\/]*)\/controller\/(.*)$/,      mod_frontcontroller.handleControllerRequest);
                app.post(/^\/[^\/]\/([^\/]*)\/controller\/(.*)$/,     mod_frontcontroller.handleControllerRequest);
                app.delete(/^\/[^\/]\/([^\.]*)\/controller\/(.*)$/,   mod_frontcontroller.handleControllerRequest);
                app.get(/^\/resources(.*)$/,                            mod_resourceservice.handleRequest);
                //app.get(/instances\/(.*)/,                              mod_instances.handleInstanceRequest);
              }
          )
          , mod_connect.static(configServer.server.documentRoot)
          , sessionParser()
          , mod_frontcontroller.handleResourceNotFound
          , errorHandler
      );
      
      if (configServer.websockets) {
          logger.info('starting websockets');
          var io = require('socket.io').listen(server);
          mod_socketio.init(io);
      }
      server.listen(configServer.server.port);
  };
}

// process.on('SIGINT', function () {
//  process.exit();
// });
