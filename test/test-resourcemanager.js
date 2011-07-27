var nodeunit	 		= require('nodeunit')
	, mod_resmanager 	= require('../lib/resourcemanager.js')
	, mod_promise 		= require('promised-io')
	, mod_cache			= require('../lib/Cache.js')
	, mod_path			= require('path')

module.exports = nodeunit.testCase({
	setUp : function (callback) {
		mod_resmanager.configure({"caching":{"resources":true}}, mod_cache);
		callback();
	}

	, testSimple : function (test) {
		var r = mod_resmanager.getResource('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js'));
		r.then(function (data) {
			test.done();	
		});
	}
});