var nodeunit	 		= require('nodeunit')
	, mod_connect       		= require('connect')
	, mod_sys         		= require('sys')
    , mod_path        		= require('path')
	, mod_resourceservice   = require('../lib/resourceservice.js')
	, mod_resourcemanager   = require('../lib/resourcemanager.js')
	, mod_tagmanager		= require('../lib/tagmanager.js')
	, mod_cache				= require('../lib/Cache.js')
	, mod_socketio			= require('../lib/socketio.js')	
    , mod_modules    		= require('../lib/modules.js')
    , mod_fs          		= require('fs')
    , cache 				= null
    , mod_renderer			= require('../lib/renderer.js')

module.exports = nodeunit.testCase({
	testSimpleX : function (test) {
		var config = null;
		var cf = mod_path.join(__dirname, '..', 'server.conf.default')
		console.log('reading config from ' + cf); 
		mod_fs.readFile(cf, function (err, data) {
			if (err) {
				console.log('error reading configuration');
				process.exit();
			}
			config = JSON.parse(data);
			//console.log('config loaded');
			mod_cache.configure(config);
			mod_resourceservice.configure(config);	
			mod_resourcemanager.configure(config, mod_cache);
			mod_tagmanager.setTagList(config.taglib);
			mod_modules.configure(config, mod_tagmanager);

			console.time('render'); 
			var r = new mod_renderer.Renderer(mod_tagmanager);
			r.render('file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')).then(function () {
				console.timeEnd('render');
				test.done();
				setTimeout(function (){process.exit();},10);
			});
		});
	}

});