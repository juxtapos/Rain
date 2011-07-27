var mod_fs 			= require('fs')
   	, spawn 		= require('child_process').spawn
	, serverfile 	= __dirname + '/lib/server.js'
	, currentServer = null
	, logger 		= require('./lib/logger.js').getLogger()

if (process.argv.length < 3) {
	logger.error('usage: ...');
	process.exit();
}

mod_fs.watchFile(serverfile, { persistent: true, interval: 200 }, function (curr, prev) {
  	// why does a string compare not work? 
  	if (new Date(curr.mtime).getTime() == new Date(prev.mtime).getTime()) { return; }
  	if (currentServer) { 
  		console.log('\033[31mrun: server reloading');
  		currentServer.kill('SIGINT');
  	}
  	setTimeout(function () {
  		currentServer = spawnServer();
	}, 300)
});

spawnServer();

function spawnServer() {
	var server = currentServer = spawn('node', [serverfile, process.argv[2]]);
	server.stdout.on('data', function (data) {
		// [TBD] not so nice, but do so until I can connect streams.
		var data = data.toString().substring(0, data.length-1);
		logger.info(data);
	});
	server.stderr.on('data', function (data) {
		var data = data.toString().substring(0, data.length-1);
		logger.error(data);
		setTimeout(function () { 
			logger.error('\033[31mrun: server error, exiting');
      if (currentServer) currentServer.kill('SIGINT');
			process.exit(); 
		}, 100);
	});
	console.log('\033[31mrun: server spawned');
	return server;
}
