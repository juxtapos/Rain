	var mod_connect       		= require('connect')
	, mod_sys         			= require('sys')
    , mod_path        			= require('path')
	, mod_mod_resourceservice   = require('./lib/resourceservice.js')
    , mod_modules    			= require('./lib/modules.js')
    , mod_fs          			= require('fs');

var config = {
	"server" : {
		"port" : 1337
		, "serverRoot"   : __dirname
		, "documentRoot" : mod_path.join(__dirname, 'public')
		//, "modulePath" : "modules"
	}
};

mod_fs.readFile('server.config', function (err, data) {
	mod_resources.configure(JSON.parse(data));	
	createServer(config);
});





function createServer(config) {
	var server = mod_connect.createServer(
	    mod_connect.favicon()
	    , mod_connect.router(function (app) {
			    app.get(/^\/modules\/([^\.]*)\/(.*\.js)$/, 			mod_modules.handleScriptRequest);
			    // [TBD] better view routing
			    app.get(/^\/modules\/([^\.]*)\/(.*\.html)$/,		mod_modules.handleViewRequest);			   
				app.get(/^\/modules\/([^\.]*)\/controller\/(.*)$/,  mod_modules.handleControllerRequest);
				app.get(/^\/resources(.*)$/,               			mod_resourceservice.handleResourceRequest);
				//app.get(/instances\/(.*)/,             			  mod_instances.handleInstanceRequest);
			}
	    )
	    , mod_connect.static(config.server.documentRoot)		
	    , mod_connect.logger()            
	);

	// Next two statements must be in this order. 
	// Why? (but then, who cares? it fucking works)
	// var io = require('socket.io').listen(server);
	server.listen(config.server.port);


	// io.sockets.on('connection', function (socket) {
	//   io.sockets.emit('this', { will: 'be received by everyone' });

	//   socket.on('private message', function (from, msg) {
	//     console.log('I received a private message by ', from, ' saying ', msg);
	//   });

	//   socket.on('disconnect', function () {
	//     io.sockets.emit('user disconnected');
	//   });
	// });

	// console.log('server started on port ' + config.server.port);

	// setTimeout(function() {
	// 	io.sockets.emit('ficken!', {grunz : 1});
	// }, 5000);
}






process.on('SIGINT', function () {
	process.exit();
});