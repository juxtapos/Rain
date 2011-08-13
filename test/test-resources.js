var nodeunit	 		= require('nodeunit')
	, mod_resources 	= require('../lib/resources.js')
	, Resource			= mod_resources.Resource
	, promises  		= require('promised-io')
	, assert			= require('assert')
	, mod_path			= require('path')

module.exports = nodeunit.testCase({
	setUp : function (callback) {
		callback();
	},

	simpleDependency : function (test) {
		var url1 = 'file://' + mod_path.join(__dirname, '..', '/lib/server.js')
			, url2 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')

		var r1 = new Resource(url1);
		var r2 = new Resource(url2);
		r1.addDependency(r2);

		r1.load();
		r1.loadDependencies();

		r1.addListener('stateChanged', function (resource) {
			if (resource.state == Resource.STATES.COMPLETE) test.done();

		});
	}, 

	chainImplicit : function (test) {
		var url1 = 'file://' + mod_path.join(__dirname, '..', '/lib/server.js')
			, url2 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')
			, url3 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')

		var r1 = new Resource(url1);
		var r2 = new Resource(url2);
		var r3 = new Resource(url3);
		r1.addDependency(r2);
		r2.addDependency(r3);

		r1.load();
		r2.load();
		r3.load();

		r2.state = Resource.STATES.LOADING;

		r1.addListener('stateChanged', function (resource) {
			if (resource.state == Resource.STATES.COMPLETE) {
				test.done();
			}
		});
	},

	complexDependencies : function (test) {
		var url1 = 'file://' + mod_path.join(__dirname, '..', '/lib/server.js')
			, url2 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')
			, url3 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html')
			, url4 = url1

		var r1 = new Resource(url1);
		var r2 = new Resource(url2);
		var r3 = new Resource(url3);
		var r4 = new Resource(url4);
		r3.addDependency(r4);
		r1.addDependency(r2);
		r1.addDependency(r3);

		r1.load();
		r1.loadDependencies();
		r2.load();
		r3.load();
		r4.load();

		r1.addListener('stateChanged', function (resource) {
			if (resource.state == Resource.STATES.COMPLETE) {
				test.done();
			}
		});
	},

	addDependencyAfterLoadStarted : function () {
		var url1 = 'file://' + mod_path.join(__dirname, '..', '/lib/server.js')
			, url2 = 'file://' + mod_path.join(__dirname, '..', '/modules/app/htdocs/index.html');
		var r1 = new Resource(url1);
		var r2 = new Resource(url2);
		r1.load();
		r1.addDependency(r2);
	}
});