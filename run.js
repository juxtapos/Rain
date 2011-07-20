var mod_fs = require('fs')
   	, spawn = require('child_process').spawn
	, serverfile = __dirname + '/server.js'
	, currentServer = null

mod_fs.watchFile(serverfile, { persistent: true, interval: 100 }, function (curr, prev) {
  	// why does a string compare not work? 
  	if (new Date(curr.mtime).getTime() == new Date(prev.mtime).getTime()) { return; }
  	if (currentServer) {
  		console.log('************* run: server reloading');
  		currentServer.kill('SIGINT');
  	}
  	setTimeout(function () {
  		currentServer = spawnServer();
	}, 500)
});

spawnServer();

function spawnServer() {
	var server = currentServer = spawn('node', [serverfile]);
	server.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	server.stderr.on('data', function (data) {
		console.log(data.toString());
		setTimeout(function () { 
			console.log('************* run: server error, exiting');
      if (currentServer) currentServer.kill('SIGINT');
			process.exit(); 
		}, 100);
	});
	console.log('************* run: server spawned');
	return server;
}
