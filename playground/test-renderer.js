var Renderer 		= require('./renderer.js').Renderer,
	c 				= console.log,
	Resource        = require('../lib/resources.js').Resource,
	configModules = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'conf', 'module.conf.local')).toString()),
	modulecontainer = require('../lib/modulecontainer.js')(configModules);


var compconfig = modulecontainer.resolveFromRequestPath('/modules/app');
var res1 = new Resource('file:///Users/cag/workspace/rain/modules/app/htdocs/index.html');
// var compconfig = modulecontainer.resolveFromRequestPath('/modules/cockpit');
// var res1 = new Resource('file:///Users/cag/workspace/rain/modules/cockpit/htdocs/main.html');
// var compconfig = modulecontainer.resolveFromRequestPath('/modules/toolbar');
// var res1 = new Resource('file:///Users/cag/workspace/rain/modules/toolbar/htdocs/main.html');

var render1 = new Renderer(compconfig, res1, 'html');
res1.load();


render1.once('stateChanged', function (renderer) {
	if (renderer.state == Renderer.STATES.RENDERED) {
		c('done');
		//Renderer.showTree(render1);
	}
});