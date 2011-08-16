"use strict";

/**
 * The Resource Service, code name "cyclone" ;-), is a center piece of Rain. 
 * Clients can call it with a list of resources separated by semicolons, 
 * that are loaded and concatenated in the order of their occurence. 
 * Rain currently creates request markup that points to  this service in the render process. 
 * 
 * Examples:
 *
 * <link rel="stylesheet" type="text/css" href="/resources?files=/modules/scrollabletable/main.css
 * ;/modules/domains/main.css;/modules/weather/main.css;/modules/app/application.css
 * ;/modules/app/jquery-ui/css/smoothness/jquery-ui-1.8.14.custom.css"/> 
 * 
 * <script type="application/javascript" src="/resources?files=/modules/app/require-jquery.js
 * ;/modules/app/jquery-ui/js/jquery-ui-1.8.14.custom.min.js
 * ;/modules/app/js/socket.io/socket.io.js"></script> 
 * 
 * Individual files in an aggregated resource are prepended by a '/* * FILE <url> * /' comment 
 * (so they can be searched)
 * 
 * The Resource Service is dumb, he does not know about depdenencies. Web clients need to know about
 * them. They do so only indirectly on an initial client request. 
 * 
 * Todos:
 * * add error handling for files not found
 * * rewrite URLs used url() in CSS files 
 * * put the little fucker into its own worker
 * 
 */

module.exports = function (c, resmgr, ch) {
	if (!c || !resmgr) { throw new Error('dependencies missing'); }
	var mod_url				= require('url')
		, mod_path			= require('path')
		, mod_cssrenderer 	= require('./cssrenderer.js')
		, logger			= require('./logger.js').getLogger('ResourceService', require('./logger.js').Logger.SEVERITY.INFO) 
		, config 			= c
		, resourceManager   = resmgr
		, cache				= ch
		, Resource 			= require('./resources.js').Resource

	/**
	 * Handles resource requests, usually created by the render engine when scanning a template file.  
	 * Resource requests are aggregated requests to CSS or JavaScript files, both can not be mixed
	 * into a single request. The correct mime type is determined by the suffix of the first 
	 * file.  
	 * 
	 * @param {request} req Request object
	 * @param {response} res Response object 
	 * @param {response} next Next connect middleware routing rule
	 * @public
	 */
	function handleRequest (req, res, next) {
		var url = mod_url.parse(req.url, true)
			, files = url.query.files.indexOf(';') === -1 
				? [url.query.files] 
				: url.query.files.split(';')
			, isCss = files[0].lastIndexOf('.css') == files[0].length - 4

		// [TBD] this mapping is shit. should be done by the resource manager
		files = files.map(function (url) {
			if (url.indexOf('http://') == 0) {
				return url;
			} else {
				return 'file://' + mod_path.join(__dirname, '..', url);	
			}
		});
		// logger.debug('handleRequest ' + url.href);
		// cache.fromCache(url.href).then(function (resource) {
		// 	if (resource === null) {

		// var cnt = 0;
		// files.forEach(function (file) {
		// 	var resource = resourceManager.loadResourceByUrl(file);
		// 	if (resource.state < Resource.STATES.LOADED) {
		// 		cnt++;
		// 		resource.once('load', function () {
		// 			cnt--;
		// 			if (cnt == 0) {
		// 				var output = [];
		// 				files.forEach(function (resource) {
		// 					var d = resource.data.toString();	
		// 					// [TBD] resolve external path and include. below is just a test. obviously.
		// 					var module = resource.url.match(/\/modules\/([^\/]+)\//)[1];

		// 					if (isCss) { d = mod_cssrenderer.render(d, module); }
		// 					output.push('\n\n\n\/\*\* FILE ', resource.url, ' */\n', d);
		// 				});
		// 				res.setHeader('Content-Type', isCss ? 'text/css' : 'application/javascript');
		// 				var out = output.join('')
		// 				res.end(out);
		// 			}
		// 		});
		// 	}
		// });

				resourceManager.getResources(files).then(function (resources) {
					var output = [];
					resources.forEach(function (resource) {
						var d = resource.data.toString();	
						// [TBD] resolve external path and include. below is just a test. obviously.
						var module = resource.url.match(/\/modules\/([^\/]+)\//)[1];

						if (isCss) { d = mod_cssrenderer.render(d, module); }
						output.push('\n\n\n\/\*\* FILE ', resource.url, ' */\n', d);
					});
					res.setHeader('Content-Type', isCss ? 'text/css' : 'application/javascript');
					var out = output.join('')
					res.end(out);
					if (cache) {
						cache.toCache(url.href, out);
					}
				});		
		// 	} else {
		// 		res.end(resource.data.toString());
		// 	}
		// });

		
	}

	return {
		'handleRequest' : handleRequest
	}
};