var mod_sys 			= require('sys')
	, mod_path 			= require('path')
	, mod_fs 			= require('fs')
	, mod_promise 		= require('promised-io')
	, mod_jsdom			= require('jsdom')
	, mod_url			= require('url')
	, mod_querystring 	= require('querystring')
	, mod_renderer		= require('./renderer.js')
	, mod_resourcemanager = require('./resourcemanager.js')
	, tagmanager 		= null
	, config 			= null
	, taglibrary		= null
	, moduleRootFolder = mod_path.join(__dirname, '..', 'modules')

function configure(c, t) {
    config = c;
    tagmanager = t;
}

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
		, mp = 'file://' + mod_path.join(moduleRootFolder, modulename, 'htdocs', path);
	console.log('handleScriptRequest ' + mp);
	res.setHeader('Content-Type', 'text/javascript');
	mod_resourcemanager.getResource(mp).then(function (resource) {
		res.end(resource.data.toString());
	});
}

function handleViewRequest (req, res, next) {
	var query = mod_querystring.parse(mod_url.parse(req.url).query)
		, mode = query.type
		, baseurl = req.url.substring(0, req.url.lastIndexOf('/'))
		, moduleUrl = 'file://' + mod_path.join(moduleRootFolder, req.params[0], 'htdocs', req.params[1]);
	console.log('handleViewRequest, path ' + moduleUrl + ',' + query.type);
	mod_resourcemanager.getResource(moduleUrl).then(function (resource) {
		var content = resource.data.toString();
		mod_renderer.parse(baseurl, content, tagmanager, mode).then(function (content) {
	 		res.end(content);
	 	});
	})
}

exports.handleControllerRequest = handleControllerRequest
exports.handleScriptRequest	 	= handleScriptRequest
exports.handleViewRequest 		= handleViewRequest
exports.configure				= configure;