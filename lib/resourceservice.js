/**
 * The resource service, code name "cyclone", is a center piece of Rain. 
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
 * 
 * Todos:
 * * add error handling for files not found
 * * rewrite URLs used url() in CSS files 
 * * put the little fucker into its own worker
 * 
 */

module.exports = function (c, resmgr) {
	var  mod_fs		 		= require('fs')
		, mod_url			= require('url')
		, mod_http			= require('http')
		, mod_promise		= require('promised-io')
		, mod_path			= require('path')
		, mod_cssnormalizer = require('./cssnormalizer.js')
		, logger			= require('./logger.js').getLogger('ResourceService')
		, config 			= c
		, resourceManager   = resmgr

	if (!config || !resmgr) { throw new Error('dependencies missing'); }

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
			, absFiles

		files = files.map(function (url) {
			return config.server.serverRoot + url.replace(new RegExp("^(/modules\/[^\/]+)"), "$1/htdocs/")
		})

		resourceManager.getResources(files).then(function (resources) {
			var output = [];
			resources.forEach(function (resource) {
				output.push('\n\n\n\/\*\* FILE ', resource.url, ' */\n', resource.data.toString());
			});
			res.setHeader('Content-Type', isCss ? 'text/css' : 'text/javascript');
			res.end(output.join(''));
		});
	}

	return {
		'handleRequest' : handleRequest
	}
};