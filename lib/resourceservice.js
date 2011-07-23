/**
 * [TBD] 
 * - add error handling
 * - connect to redis for caching
 * - support for HTTP files
 * - correct distinction between local and remote file by protocol 
 */

var  mod_fs		 	= require('fs')
	, mod_url		= require('url')
	, mod_http		= require('http')
	, mod_promise	= require('promised-io')
	, mod_path		= require('path')
	, config 		= null

/**
 * Configure must be called with a configuration object before this module can be used. 
 */
function configure (c) { 
	config = c 
};

/**
 * Handles resource requests, usually created by the render engine when scanning a template file.  
 * Resource requests are aggregated requests to CSS or JavaScript files, both can not be mixed
 * into a single request as usually. The correct mime type is dertimed by the suffix of the first 
 * file.  
 * 
 */
function handleResourceRequest (req, res, next) {
	var url = mod_url.parse(req.url, true)
		, files = url.query.files.indexOf(';') === -1 
			? [url.query.files] 
			: url.query.files.split(';')
		, isCss = files[0].lastIndexOf('.css') == files[0].length - 4
		, absFiles;

	// The config must be present for computing the absolute file path of a resource. 
	if (!config) {
		console.log('config not found');
		next();
	}

	// Translate URLs that were originally relative to a template location inside a module folder
	// to absolute file paths.
	absFiles = files.map(function (item) { 
		return item.indexOf('http://') < 0 ? urlToAbsolutePath(item) : item;
	});

	loadUrls(absFiles).then(function (data) {
		var output = absFiles.map(function (item) {
			return item && data[item] ? '\n\n\n/** FILE ' + item + '\n\n\n **/' + data[item].toString() : 'File not found'
		});

		// [TBD] Redis caching

		res.setHeader('Content-Type', isCss ? 'text/css' : 'text/javascript')
		res.end(output.join(''));
	});
}

/**
 * Checks if a file exists and loads it. 
 * Returns 'null' on non-existing files or load errors. 
 */
function loadUrl (url) { 
	var defer = mod_promise.defer();

	mod_path.exists(url, function (exists) {
		if (!exists) {
			console.log('file ' + url + ' not found');
			defer.resolve(null);
			return;
		}
		mod_fs.readFile(url, function (err, data) {
			if (err) {
				console.log(err);
				defer.resolve(null);
				return;
			}
			defer.resolve(data);
		});
	});
	return defer;
} 

/**
 * Loads an array of URLs asynchronously and simultanously. 
 * Returns a defer that is resolved upon completion of all loads. 
 * @param Array of URLs
 */
function loadUrls (urls) {
	var defer = mod_promise.defer()
		, promises = []
		, files = {}

	urls.forEach(function (url) {
		promises.push(loadUrl(url).then(function (data) {
			files[url] = data;
		}));
	});

	mod_promise.all(promises).then(function () {
		defer.resolve(files);
	});

	return defer;
}

/**
 * Creates an absolute file path from an URL coming from a resource request.
 * Absolute URLs used in templates are treated as coming from a module's (public) 'htdocs' folder.
 *
 * [TBD] make module folder configurable
 */
function urlToAbsolutePath (url) {
	url = url.replace(new RegExp("^(/modules\/[^\/]+)"), "$1/htdocs/");
	return config.server.serverRoot + url
}

exports.configure = configure;
exports.handleResourceRequest = handleResourceRequest
exports.loadUrls = loadUrls;
exports.loadUrl = loadUrl;