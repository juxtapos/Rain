var mod_http	= require('http')
	,mod_net	= require('net')
	,mod_repl 	= require('repl')
	,c 			= console.log
    ,services 	= {}

function registerService(sid) {
	c('registerService ' + sid);
	return loadModule(sid);
}

function serviceById(id) {
	return services[id];
}

function loadModule(id) {
	var p = './' + id + '.js';
	// for file paths as above, resolve is actually not required
	if (typeof require.cache[require.resolve(p)] !== 'undefined') {
		services[id].component.stop();
		delete require.cache[require.resolve(p)];
	}
	var r = require(p);
	services[id] = r; // here, not registerService, so modules can access others at init() time
	r.component.init(module.exports);
	return r;
}


mod_net.createServer(function (socket) {
  var r = mod_repl.start("RainShell> ", socket);
  r.context.registerService = registerService;
  r.context.serviceById = serviceById;
  r.context.r = registerService;

}).listen(1338);

exports.serviceById = serviceById