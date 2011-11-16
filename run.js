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

require.paths = require.paths.unshift(__dirname + "/lib");

var mod_fs 			= require('fs')
   	, spawn 		= require('child_process').spawn
	, serverfile 	= __dirname + '/lib/server.js'
	, currentServer = null
	, currentDebugger = null
	, logger 		= require('./lib/logger.js').getLogger()
	, watchingFiles = [__dirname+'/run.js']
  , dirs        = [__dirname+'/lib', __dirname+'/playground', __dirname+"/lib/tagparsing", __dirname + "/lib/intents"]; // directories to be watched

for(var i = dirs.length; i--;){
  var files = mod_fs.readdirSync(dirs[i]);
  for(var j = files.length; j--;){
    files[j] = dirs[i]+'/'+files[j];
  }
  watchingFiles = watchingFiles.concat(files);
}

for(var i = watchingFiles.length; i--;){
  mod_fs.watchFile(watchingFiles[i], { persistent: true, interval: 200 }, function (curr, prev) {
      // why does a string compare not work? 
      if (new Date(curr.mtime).getTime() == new Date(prev.mtime).getTime()) { return; }
      if (currentServer) {
        console.log('\033[31mrun: server reloading');
        currentServer.kill('SIGINT');
      }
      if (currentDebugger) {
        console.log('\033[31mrun: debugger reloading');
        currentDebugger.kill('SIGINT');
      }
      setTimeout(function () {
        currentServer = spawnServer();
      }, 100)
  });
}

spawnServer();

function spawnServer() {
	var args = [];
	// must do it this way because a node application won't receive '--' flags
	for (var i = 2, l = process.argv.length; i < l; i++) {
		if (process.argv[i] == 'debug') {
		  args.push('--debug');			
		}
		
		if (process.argv[i] == 'node-inspector') {
      currentDebugger = spawn('node-inspector');
      console.log("debugger spawned");
		}
	}
	args.push(serverfile);
	args = args.concat(process.argv.slice(2, process.argv.length));
	var server = currentServer = spawn('node', args);

	// [TBD] would be better to connect stream, which is possible now with latest node
	server.stdout.on('data', function (data) {
		var data = data.toString().trim();
		logger.info(data);
	});
	server.stderr.on('data', function (data) {
		var data = data.toString().trim();
		logger.error(data);
		// [TBD] that works until... :-), listen to signal instead
		if (data.indexOf('debugger listening on port') == 0) return;
		setTimeout(function () { 
			logger.error('\033[31mrun: server error, exiting');
      		if (currentServer) currentServer.kill('SIGINT');
      		if (currentDebugger) currentDebugger.kill('SIGINT');
			process.exit(); 
		}, 100);
	});
	console.log('\033[31mrun: server spawned');
	return server;
}
