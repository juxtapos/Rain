var nodeunit	 		= require('nodeunit')
	, mod_resmanager 	= require('../lib/resourcemanager.js')
	, mod_promise 		= require('promised-io')

module.exports = nodeunit.testCase({
	setUp : function (callback) {
		//mod_resmanager.configure({"caching":{"resources":true}});
		callback();
	}

	, testSimple : function (test) {
		var r = mod_resmanager.getResource('file:///Users/cag/workspace/rain/server.js');
		r.then(function (data) {
			test.done();	
		});
	}
});