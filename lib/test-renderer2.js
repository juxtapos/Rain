	var mod_connect       	= require('connect')
	, mod_sys         		= require('sys')
    , mod_path        		= require('path')
	, mod_resourceservice   = require('./lib/resourceservice.js')
	, mod_resourcemanager   = require('./lib/resourcemanager.js')
	, mod_tagmanager		= require('./lib/tagmanager.js')
	, mod_cache				= require('./lib/Cache.js')
	, mod_socketio			= require('./lib/socketio.js')	
    , mod_modules    		= require('./lib/modules.js')
    , mod_fs          		= require('fs')
    , cache 				= null
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
	mod_cache.configure(config);
	mod_resourceservice.configure(config);	
	mod_resourcemanager.configure(config, mod_cache);
	mod_tagmanager.setTagList(config.taglib);
	mod_modules.configure(config, mod_tagmanager);
});