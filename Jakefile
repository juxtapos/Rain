var child = require('child_process');
var cwd = process.cwd();

task('default', [], function (params) {
	console.log('Hello World!');
});

task('docs', [], function () {
	var docTaskRegex = /docs:(.+)/i;
	console.log('Building documentation');
	for (var key in jake.Task) {
		if(!key.match(docTaskRegex)) {
			continue;
		}
		var task = jake.Task[key];		
		task.invoke();
	}
});

namespace('docs', function () {
	task('generate', [], function () {
		console.log('Generating RST documntation');
		var args = [
			'-jar',
			'./tools/jsdoc-toolkit/jsrun.jar',
			'./tools/jsdoc-toolkit/app/run.js',
			cwd,			
			'-d=./doc/source/',
			'-r=10',
			'-t=./tools/jsdoc-toolkit/templates/sphinx/'
		];
		var jsdoc = child.spawn('java', args);
		jsdoc.stdout.on('data', function (data) {
			var buffer = new Buffer(data);
			console.log(buffer.toString());
		});
		jsdoc.stderr.on('data', function (data) {
			console.log('Error: ' + data);
		});
	});

	task('compile', [], function () {
		console.log('Building documentation');
		var sphinx = child.spawn('make', ['html'], {cwd: './doc', env: process.env});
		sphinx.stdout.on('data', function (data) {
			var buffer = new Buffer(data);
			console.log(buffer.toString());
		});
		sphinx.stderr.on('data', function (data) {
			console.log('Error: ' + data);
		});
	});
});
