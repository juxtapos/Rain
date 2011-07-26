var promise = require('promised-io')
	, sys 	= require('sys')


	, c 	= console.log
	, i 	= sys.inspect


var urls = {
	'foo.html' : {
		dependencies : {
			css : [ 'foo.css', 'foo2.css' ]
			, urls : ['1.html', '2.html']
		}
	},
	'1.html' : {
		dependencies : {
			css : [ '1.css', '1.1.css' ]
		}
	}, 
	'2.html' : {
		dependencies : {
			css : ['2.css']
			, urls : ['3.html']
		}
	}
	,'3.html' : {
		dependencies : {
			css  : [ 'number6.css' ] 
		}
	}
}



function Renderer(tagmanager) {
	if (!tagmanager) { throw new Error('tagmanager required'); }
	this.dependencies = [];
}

Renderer.prototype.render = function (url) {
	var self = this;
	return this._render(url).then(function () {
		c('dependencies:');
		self.dependencies.forEach(function (item) { c(item); })
	});
}

Renderer.prototype._render = function (url) {
	var p = new promise.Promise()
		, self = this

	c('render...');

	self.loadResource(url).then(function (){
		self.parse(url).then(function (parsed) { 
			c('after parse ' + url);
			c(parsed);

			if (parsed.css) parsed.css.forEach(function (item) { self.dependencies.push(item); });
			//if (parsed.css) parsed.forEach(function (item) { self.dependencies.push(item); });

			var r = [];
			if (parsed && parsed.urls) {
				parsed.urls.forEach(function (item) {
					if (urls[item]) r.push(self._render(item))
				});

				promise.all(r).then(function (all) {
					c('gotem all for ' + url)
					c(i(all));
					p.resolve(all);	
				});
			} else {
				c('no deps for ' + url)
				p.resolve([parsed]);
			}
		});
	});

	return p;
}

Renderer.prototype.parse = function (url) {
	var p = new promise.Promise(),
		self = this;
	c('parse url ' + url + ' ...');
	setTimeout(function () {
		var data = urls[url] && urls[url].dependencies ? urls[url].dependencies : {css:[]};
		c('parse done ' + url);
		c(data)
		p.resolve(data);
	}, Math.random()*100)

	return p;
}

Renderer.prototype.loadResource = function (url) {
	var p = new promise.Promise();
	c('loadResource ' + url + ' ...');
	setTimeout(function () {
		c('resource ' + url + ' loaded');
		p.resolve();
	}, Math.random()*100);
	return p;
}





run();
function run() {
	var rndr = new Renderer({});
	c(i(rndr))
	rndr.render('foo.html').then(function () {
		c('done')
	})
};