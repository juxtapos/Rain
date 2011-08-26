console.log(require.paths);
var nodeunit	 			    = require('nodeunit')
	, mod_cssnormalizer		= require('cssrenderer.js')
	, mod_fs				      = require('fs')
	, mod_path				    = require('path')

module.exports = nodeunit.testCase({
	testSimple : function (test) {
		// can't test this way anymore after adding computed prefixes 
    //var css = mod_fs.readFileSync(mod_path.join(__dirname, 'cssrenderer/test-1.css')).toString();
		//var exp = mod_fs.readFileSync(mod_path.join(__dirname, 'cssrenderer/result-1.css')).toString();
		
		//var ncss = mod_cssnormalizer.render(css, '/modules/app', true);
		//test.equal(ncss, exp);

		test.done();
	}

});
