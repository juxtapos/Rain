	var mod_connect       	= require('connect')
	, mod_sys         		= require('sys')
    , mod_path        		= require('path')
	, mod_resourceservice   = require('./lib/resourceservice.js')
    , mod_modules    		= require('./lib/modules.js')
    , mod_fs          		= require('fs')
    , logger				= require('./lib/logger.js').getLogger('Server')

// [TBD] Configuration manager
var config = null;
mod_fs.readFile('server.config', function (err, data) {
	config = JSON.parse(data);
	logger.info('config loaded');
	mod_resourceservice.configure(config);	
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