var nodeunit	 		= require('nodeunit')
	, mod_resources 	= require('../lib/resources.js')
	, promises  		= require('promised-io')
	, assert			= require('assert')

module.exports = nodeunit.testCase({
	setUp : function (callback) {
		callback();
	}

	, testFileSimple : function (test) {
		var resource1 = new mod_resources.FileResource();
		assert.notEqual(resource1, null);
		assert.throws(function () { resource1.load(); });
		assert.equal(resource1.state, mod_resources.Resource.STATE.INIT);
		// [TBD] change path
		assert.throws(function () { resource1.load('/Users/cag/workspace/rain/server.js') });
		assert.doesNotThrow(function () { resource1.load('file:///Users/cag/workspace/rain/server.js') });
		assert.equal(resource1.state, mod_resources.Resource.STATE.LOADING);
		resource1.addListener('stateChanged', function (res) {
			assert.equal(res.state, mod_resources.Resource.STATE.READY);
			test.done();
		});
	}

	, testHttpSimple : function (test) {
		var resource2 = new mod_resources.HttpResource();
		assert.notEqual(resource2, null);
		assert.throws(function () { resource2.load();});
		assert.equal(resource2.state, mod_resources.Resource.STATE.INIT);
		assert.throws(function () { resource2.load('heise.de') });
		assert.doesNotThrow(function () { resource2.load('http://heise.de') });
		assert.throws(function () { resource2.load(); });
		// [TBD] how to do error handling in case in domain can't be resolved? 
		// doesn't seem to be possible when using http.get 
		//assert.throws(function () { resource2.load('http://127.255.255.1/I/dont/exist') });
		assert.equal(resource2.state, mod_resources.Resource.STATE.LOADING);
		resource2.addListener('stateChanged', function (res) {
			assert.equal(res.state, mod_resources.Resource.STATE.READY);
			test.done();
		});
	}
});