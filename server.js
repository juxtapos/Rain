	var mod_connect       	= require('connect')
	, mod_sys         		= require('sys')
    , mod_path        		= require('path')
	, mod_resourceservice   = require('./lib/resourceservice.js')
	, mod_resourcemanager   = require('./lib/resourcemanager.js')
    , mod_modules    		= require('./lib/modules.js')
    , mod_fs          		= require('fs')
    , logger				= require('./lib/logger.js').getLogger('Server')

if (process.argv.length < 3) {
	logger.error('usage: ...');
	process.exit();
}

// [TBD] handle arguments properly
// [TBD] dynamic config service 
var config = null;
logger.info('reading config from ' + process.argv[2]);
mod_fs.readFile(process.argv[2], function (err, data) {
	if (err) {
		logger.error('error reading configuration');
		process.exit();
	}
	config = JSON.parse(data);
	logger.info('config loaded');
	mod_resourceservice.configure(config);	
	mod_resourcemanager.configure(config);
	createServer(config);
});





function createServer(config) {
	var server = mod_connect.createServer(
	    mod_connect.favicon()
	    , mod_connect.router(function (app) {
			    app.get(/^\/modules\/([^\.]*)\/(.*\.js)$/, 			mod_modules.handleScriptRequest);
			    app.get(/^\/modules\/([^\.]*)\/(.*\.html)$/,		mod_modules.handleViewRequest);			   
				app.get(/^\/modules\/([^\.]*)\/controller\/(.*)$/,  mod_modules.handleControllerRequest);
				app.get(/^\/resources(.*)$/,               			mod_resourceservice.handleResourceRequest);
				//app.get(/instances\/(.*)/,             			  mod_instances.handleInstanceRequest);
			}
	    )
	    , mod_connect.static(config.server.documentRoot)		
	    , mod_connect.logger()            
	);
	server.listen(config.server.port);
}

// process.on('SIGINT', function () {
// 	process.exit();
// });