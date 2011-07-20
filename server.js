var mod_connect       = require('connect')
	, mod_sys         = require('sys')
    , mod_path        = require('path')
	, mod_resources   = require('./lib/resources.js')
    , mod_modules     = require('./lib/modules.js')
    , mod_fs          = require('fs');

var config = {
	"server" : {
		"port" : 1337
		, "serverRoot"   : __dirname
		, "documentRoot" : mod_path.join(__dirname, 'public')
		//, "modulePath" : "modules"
	}
};

mod_resources.configure(config);

createServer(config);



function createServer(config) {
	var server = mod_connect.createServer(
	    mod_connect.favicon()
	    , mod_connect.router(function (app) {
			    app.get(/^\/modules\/([^\.]*)\/(.*\.js)/,  mod_modules.handleScriptRequest);
			    // [TBD] better view routing
			    app.get(/^\/modules\/([^\.]*)\/(.*)$/,     mod_modules.handleViewRequest);			   
				app.get(/^\/modules\/(.*)/,                mod_modules.handleActionRequest);
				app.get(/^\/resources(.*)/,                mod_resources.handleResourceRequest);
				//app.get(/instances\/(.*)/,             mod_instances.handleInstanceRequest);
			}
	    )
	    , mod_connect.static(config.server.documentRoot)		
	    , mod_connect.logger()            
	).listen(config.server.port);

	console.log('server started on port ' + config.server.port);
}

process.on('SIGINT', function () {
	process.exit();
});