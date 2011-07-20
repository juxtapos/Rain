var mod_fs 			= require('fs'),
	mod_http 		= require('http'),
	mod_path 		= require('path'),
	mod_promise 	= require('promised-io');

exports.init = init;
exports.getWeatherData = getWeatherData;

function init() {
	
}

function getWeatherData() {
	var defer = mod_promise.defer();

	var o = {
			host 	: 'weather.yahooapis.com',
			port 	: 80,
			path 	: '/forecastrss?w=664942&u=c'
		},
		data = [],
		request = mod_http.get(o, function (res) {
			console.log('req rcvd');

			res.on('data', function (chunk) {
				data.push(chunk);
			});
			res.on('end', function () {	
				var d = data.join('');
				var desc = d.match(/<!\[CDATA\[([\s\S]+)\]\]>/m)[1];
				defer.resolve({
					data : desc
				});
			});
		})
		.on('error', function (err) {
			console.log('error ' + err);
		});

	return defer;
}

console.log(module);