var mod_fs 					= require('fs')
	, mod_http 				= require('http')
	, mod_path 				= require('path')
	, mod_promise 			= require('promised-io/promise')
	, mod_url               = require('url')
    , mod_querystring       = require('querystring')
    //, logger                = require('./logger.js').getLogger('weather/main', require('./logger.js').Logger.SEVERITY.INFO)
    logger = { debug : console.log }

function init() {
	
}

function getWeatherData(req, res) {
	//console.log('getWeatherData');
	var query = mod_querystring.parse(mod_url.parse(req.url).query)
	//logger.debug(query.location);

	var defer = mod_promise.defer();

	var o = {
			host 	: 'weather.yahooapis.com',
			port 	: 80,
			path 	: '/forecastrss?w=' + query.location + '&u=c'
		},
		data = [],
		request = mod_http.get(o, function (res) {
			res.on('data', function (chunk) {
				data.push(chunk);
			});
			res.on('end', function () {	
				var d = data.join('');
				var desc;
				try {
					desc = d.match(/<!\[CDATA\[([\s\S]+)\]\]>/m)[1];
				} catch (ex) {
					desc = '';
				}
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

exports.init = init;
exports.getWeatherData = getWeatherData;
