var nodeunit	 			= require('nodeunit')
	, mod_cssnormalizer		= require('../lib/cssnormalizer.js')

module.exports = nodeunit.testCase({
	testSimple : function (test) {
		var css = "p{background-image:url(/test/me.css)}\n\ntd { \n background-image: url('../../../foo.png');\ncolor:red}\na {\n background-image: url(\"bar.png\");\n\n@import url(grunz.css)";
		var exp = 'p{background-image:url("/modules/app/test/me.css")}\n\ntd { \n background-image: url("/foo.png");\ncolor:red}\na {\n background-image: url("/modules/app/bar.png");\n\n@import url("/modules/app/grunz.css")';

		var ncss = mod_cssnormalizer.normalize(css, '/modules/app');
		test.equal(ncss, exp);
		test.done();
	}

});