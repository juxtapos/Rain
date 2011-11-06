var mod_resmanager    = require('../lib/resourcemanager.js')(true, true)
    , mod_promise       = require('promised-io/promise')
    , mod_cache         = require('../lib/Cache.js')
    , mod_path          = require('path')
    , Resource          = require('../lib/resources.js').Resource
    , c = console.log
    //, c = function (){}
var url1 = 'file:///Users/cag/workspace/rain/modules/app/htdocs/index.html'; // 1997
var url2 = 'file:///Users/cag/workspace/rain/modules/weather/htdocs/main.html'; // 270
var url3 = 'http://127.0.0.1:1337/modules/weather/main.html';
var url4 = 'http://127.0.0.1:1337/modules/weather/htdocs/css/main.css';

for (var i=0; i < 1000; i++) {
	var r1 = mod_resmanager.getResourceByUrl(url1).load();
	r1.once('load', function (resource) {
		c(resource.url + ',' + resource.data.length);
	});
	var r2 = mod_resmanager.getResourceByUrl(url2).load();
	r2.once('load', function (resource) {
		c(resource.url + ',' + resource.data.length);
	});
	var r3 = mod_resmanager.getResourceByUrl(url3).load();
	r3.once('load', function (resource) {
		c(resource.url + ',' + resource.data.length);
	});
	var r4 = mod_resmanager.getResourceByUrl(url4).load();
	r4.once('load', function (resource) {
		c(resource.url + ',' + resource.data.length);
	});
}
