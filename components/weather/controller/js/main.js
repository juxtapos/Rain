var c 						= console.log
	, http 					= require('http')
	, mod_querystring       = require('querystring')
	, mod_url               = require('url')

var httpOpts = {
	host : 'juxtapos.de'
  , port : 5984
  , path : '/rain-dev/'
};

function doGet (request, response) {
	var query = mod_querystring.parse(mod_url.parse(request.url).query);
	c('doGet');
	response.write('get on app main.js');
	httpOpts.method = 'GET';
	httpOpts.path += '/' + query.docid;

	var doc = [];
	var req = http.get(httpOpts, function (res) {
		res.on('data', function (data) {
			c('data ' + data);
			doc.push(data);
		});
		res.on('end', function () {
			response.end(doc.join(''));
		})
	});
}

function doPost (request, response) {
	c('doPost ');
	//c(request.body)
	httpOpts.method = 'POST';

	var req = http.request(httpOpts, function (res) {
		//c('connection established')
		res.on('data', function (data) {
			c('response ' + data);
			//response.end('success');
		});
	});
	
	var data = JSON.stringify(request.body);
	req.end(data);
}

function doDelete (request, response) {
	
}

function doPut (request, response) {
	var query = mod_querystring.parse(mod_url.parse(request.url).query);
	if (!query.docid) {
		throw new Error('docid request parameter missing');
	}
	c('doPut');
	c('store ' + query.docid)
	httpOpts.method = 'PUT';
	httpOpts.path += '/' + query.docid;
	var req = http.request(httpOpts, function (res) {
		console.log('req est.');
		res.on('data', function (data) {
			c('data ' + data);
		});
	});

	var data = JSON.stringify(query);
	req.write(data);
	req.end();
}

exports.get = doGet;
exports.post = doPost;
exports.delete = doDelete;
exports.put = doPut;