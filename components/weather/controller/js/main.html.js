var c = console.log;

module.exports = function () {


	function init() {
		c('init view controller main weather');
	}

	return {
		init : init
	}
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