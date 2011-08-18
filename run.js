var mod_fs 			= require('fs')
   	, spawn 		= require('child_process').spawn
	, serverfile 	= __dirname + '/lib/server.js'
	, currentServer = null
	, logger 		= require('./lib/logger.js').getLogger()

mod_fs.watchFile('./run.js', { persistent: true, interval: 200 }, function (curr, prev) {
  	// why does a string compare not work? 
  	if (new Date(curr.mtime).getTime() == new Date(prev.mtime).getTime()) { return; }
  	if (currentServer) { 
  		console.log('\033[31mrun: server reloading');
  		currentServer.kill('SIGINT');
  	}
  	setTimeout(function () {
  		currentServer = spawnServer();
	}, 100)
});

spawnServer();

function spawnServer() {
	var args = [];
	// must do it this way because a node application won't receive '--' flags
	for (var i = 2, l = process.argv.length; i < l; i++) {
		if (process.argv[i] == 'debug') {
			args.push('--debug');
			break;			
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
			process.exit(); 
		}, 100);
	});
	console.log('\033[31mrun: server spawned');
	return server;
}
