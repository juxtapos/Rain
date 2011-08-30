var Renderer 		= require('./renderer.js').Renderer,
	c 				= console.log,
	Resource        = require('../lib/resources.js').Resource,
	configServer 	= JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'conf', 'server.conf.default')).toString())
	modulecontainer = require('../lib/modulecontainer.js')(),
	tagmanager		= require('../lib/tagmanager.js'),
	Renderer 		= require('./renderer.js')(tagmanager, modulecontainer).Renderer;


tagmanager.setTagList(configServer.taglib);



var requrl = '/modules/app/htdocs/index.html';
var requrl = '/modules/toolbar/htdocs/main.html';
var requrl = '/modules/cockpit/htdocs/main.html';

var render1 = new Renderer(requrl, 'html', null);

render1.once('stateChanged', function (renderer) {
	if (renderer.state == Renderer.STATES.RENDERED) {
		c(renderer.renderresult.content);
		//Renderer.showTree(render1);
	}
});
