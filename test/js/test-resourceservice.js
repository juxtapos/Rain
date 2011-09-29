var nodeunit  = require('nodeunit')
	, resources = require('resources.js')
	, promises  = require('promised-io/promise')

var testfiles = [
	"../../modules/app/application.css", "../../modules/app/nothere.js", "./resources.js"
];


/***
 * 
 * REFACTOR TO NEW MODULE 
 */ 
 
module.exports = nodeunit.testCase({
	setUp : function (callback) {
		//resources.configure({"server":{"serverRoot" : __dirname + 'x'}});
		callback();
	}

	, testLoadUrls : function (test) {
		// resources.loadUrls(testfiles).then(function (data) {
		 	test.done();
		// });
	}
});
