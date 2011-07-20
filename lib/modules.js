var mod_sys 			= require('sys')
	, mod_path 			= require('path')
	, mod_fs 			= require('fs')
	, mod_promise 		= require('promised-io')
	, mod_jsdom			= require('jsdom')
	, mod_url			= require('url')
	, mod_querystring 	= require('querystring')
	, mod_renderer		= require('./renderer.js')
	, mod_tagmanager 	= require('./tagmanager.js');

var taglib = [
  {
    namespace : '',
    selector : 'app[type=weather]',
    module : 'weather'
  }
  ,{
    namespace : 'http://1and1.com/hip/hop',
    selector : 'domains',
    module : 'domains'
  }
  ,{
    namespace : '',
    selector : '*[type=scrollabletable]',
    module : 'scrollabletable'
  }
];
mod_tagmanager.setTagList(taglib);

// var redbackClient = require('redback').createClient(),
// cache = redbackClient.createCache('softporn');

function handleControllerRequest (req, res, next) {
	console.log('handleControllerRequest ' + req.url);
	var modulename = req.params[0]
		, method = req.params[1]
		, mp = mod_path.join(__dirname, '..', 'modules', modulename, 'main.js')

	mod_path.exists(mp, function (exists) {
		if (exists) {
			var module = require(mp);
			if (module[method]) {
				module[method](req, res).then(function (ret) {
					console.log('done');
					res.end(ret.data);
				});
			} else {
				res.writeHead(404, { 'Content-Type' : 'text/plain'} );
				res.end('method not available');
			}	
		} else {
			res.writeHead(404, { 'Content-Type' : 'text/plain'} );
			res.end('unknown module ' + modulename);
		}
	});
}

function handleScriptRequest (req, res, next) {
	var modulename = req.params[0]
		, path = req.params[1]
		, mp = mod_path.join(__dirname, '..', 'modules', modulename, 'htdocs', path);
	//console.log('handleScriptRequest ' + mp);
	res.setHeader('Content-Type', 'text/javascript');
	var content = getFile(mp, function (val) {
		res.end(val);
	});
}

function handleViewRequest (req, res, next) {
	var path = getAbsoluteFilePath(req)
		, url = mod_url.parse(req.url)
		, query = mod_querystring.parse(url.query)
		, mode = query.type
		, bei = req.url.lastIndexOf('/')
		, baseurl = req.url.substring(0, bei)

	console.log('handleViewRequest, path ' + path + ',' + query.type);
	getFile(path, function (content) {
		var parsed = mod_renderer.parse(baseurl, content, mod_tagmanager, mode).then(function (content) {
			res.end(content);
		});
	});
}

function getFile(path, callback) {
	if (typeof cache !== 'undefined' && cache !== null) {
		cache.exists(path, function (err, exists) {
			if (exists) {
				console.log('get ' + path + ' from cache');
				cache.get(path, function (err, val) {
					callback(val);
				});
			} else {
				var content = mod_fs.readFileSync(path).toString();
				cache.add(path, content, function (err, added) {
				   callback(content);
			    });
			}							
		});
	} else {
		callback(mod_fs.readFileSync(path).toString());
	}
}

function getAbsoluteFilePath(req) {
	var module = req.params[0]
		, file = req.params[1]
		, mp = mod_path.join(__dirname, '..', 'modules', module, 'htdocs', file);
	return mp;
}

exports.handleControllerRequest = handleControllerRequest
exports.handleScriptRequest = handleScriptRequest
exports.handleViewRequest 	= handleViewRequest