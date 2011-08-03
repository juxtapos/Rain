var nodeunit	 			= require('nodeunit')
	, mod_cssnormalizer		= require('../lib/cssrenderer.js')
	, mod_fs				= require('fs')

module.exports = nodeunit.testCase({
	testSimple : function (test) {
		var css = 'import ()\n\n* {\n	background-color:red;\nbackground-image:url(test/me.css);\ncolor:#cafe73;}\n} \n\ntd a { \n background-image: url("../../../foo.png");\ncolor:red}\n#foo a {\n background-image: url(\"http://test/bar.png\");\n}\n@import url(grunz.css)';
		var exp = '*.23ea95b683c82c732db81c54db57af09 p {\nbackground-image:url("/modules/app/test/me.css");color:#cafe73 \n} \ntd.23ea95b683c82c732db81c54db57af09 a { \n background-image: url("/foo.png");\ncolor:red}\n#23ea95b683c82c732db81c54db57af09-foo a {\n background-image: url("http://test/bar.png");\n}\n@import url("/modules/app/grunz.css")';

		var ncss = mod_cssnormalizer.render(css, '/modules/app', true);
		test.equal(ncss, exp);

		var ncss = mod_cssnormalizer.render(css, '/modules/app', false);
		test.notEqual(ncss, exp);

		var ncss = mod_cssnormalizer.render(css, '/modules/app', false);
		test.equal(ncss, ncss);

		test.done();
	}

});