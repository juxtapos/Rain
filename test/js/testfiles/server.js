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
    , mod_util = require('util')
    , mod_path              = require('path')
    , mod_resourceservice   = null
    , mod_resourcemanager   = null
    , mod_modulecontainer   = null
    , mod_tagmanager        = require('./tagmanager.js')
    , mod_cache             = require('./cache.js')
    , mod_socketio          = require('./socketio.js')   
    , mod_modules           = null
    , mod_fs                = require('fs')
    , cache                 = null
    , redisclient           = null
    , logger                = require('./logger.js').getLogger(mod_path.basename(module.filename))

// [TBD] dynamic configServer service (requires dependency management first)

/** TODO: remove if debugging information from --debug fixed with an endOfLine */    
console.log('');
    
var configServer = null,
    configModules = null,
    args = {};

for (var i = 2, l = process.argv.length; i < l; i++) {
  var arg = process.argv[i];
  if (arg.indexOf('=') > 1) {
    arg = arg.split('=');
    args[arg[0]] = arg[1];
  }
}

if(!args['server-conf']) {
    logger.info('set default: server.conf.default');
    args['server-conf'] = mod_path.join(__dirname, '..', 'conf', 'server.conf.default');
}
logger.info('reading server configuration from ' + args['server-conf']);
mod_fs.readFile(args['server-conf'], function (err, data) {
    if (err) {
        logger.error('error reading server configuration');
        process.exit();
    }
    
    configServer = JSON.parse(data);
    logger.info('server configuration loaded');
    configureServer(configServer);
});

// [TBD] move to module container
// if(!args['module-conf']) {
//   logger.info('set default: module.conf.default');
//   args['module-conf'] = mod_path.join(__dirname, '..', 'conf', 'module.conf.default');
// }
// logger.info('reading webcomponent configuration from ' + args['module-conf']);
// mod_fs.readFile(args['module-conf'], function (err, data) {
//   if (err) {
//       logger.error('error reading webcomponent configuration');
//       process.exit();
//   }
  
//   configModules = JSON.parse(data);
//   logger.info('webcomponent configuration loaded');
//   if(configServer)
//     configureServer(configServer, configModules);
//  
// });

function configureServer (configServer) {
  
  mod_cache.configure(configServer);
  mod_resourcemanager = require('./resourcemanager.js')(configServer, mod_cache);
  mod_modulecontainer = require('./modulecontainer.js')();
  mod_resourceservice = require('./resourceservice.js')(configServer, mod_resourcemanager, mod_cache, mod_modulecontainer);
  mod_tagmanager.setTagList(configServer.taglib);
  mod_modules = require('./modules.js')(mod_tagmanager, mod_resourcemanager, mod_modulecontainer);

  if (configServer.remotecontrol) {
      logger.info('setting up remote control');
      redisclient = require('./redisclient.js');
      redisclient.init(mod_tagmanager);
  }

  createServer(configServer);
  logger.info('server started on port ' + configServer.server.port + ', ' + new Date());
}

function createServer(configServer) {
    var server = mod_connect.createServer(
        mod_connect.favicon()
        , mod_connect.bodyParser()
        , mod_connect.router(function (app) {
                app.get(/^\/modules\/([^\/]*)\/(.*\.html)$/,                mod_modules.handleViewRequest);            
                app.get(/^\/modules\/([^\/]*)\/controller\/(.*\.js)$/,      mod_modules.handleControllerRequest);
                app.put(/^\/modules\/([^\/]*)\/controller\/(.*\.js)$/,      mod_modules.handleControllerRequest);
                app.post(/^\/modules\/([^\/]*)\/controller\/(.*\.js)$/,     mod_modules.handleControllerRequest);
                app.delete(/^\/modules\/([^\.]*)\/controller\/(.*\.js)$/,   mod_modules.handleControllerRequest);
                app.get(/^\/resources(.*)$/,                                mod_resourceservice.handleRequest);
                //app.get(/instances\/(.*)/,                                  mod_instances.handleInstanceRequest);
            }
        )
        , mod_connect.static(configServer.server.documentRoot)        
        , mod_connect.logger()
    );
    
    if (configServer.websockets) {
        logger.info('starting websockets');
        var io = require('socket.io').listen(server);
        mod_socketio.init(io);
    }
    server.listen(configServer.server.port);
}

// process.on('SIGINT', function () {
//  process.exit();
// });