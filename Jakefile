var child = require('child_process');
var cwd = process.cwd();

desc('Print the help message');
task('default', [], function (params) {
	jake.showAllTaskDescriptions();
});

desc('Generate and build the client documentation');
task('clientdocs', [], function () {
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


namespace('clientdocs', function () {
	desc('Generate the client documentation');
	task('generate', [], function () {
		console.log('Generating RST documntation');
		var args = [
			'-jar',
			'./tools/jsdoc-toolkit/jsrun.jar',
			'./tools/jsdoc-toolkit/app/run.js',
			'-c=./tools/jsdoc-toolkit/client.conf',
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

	desc('Build the client documentation');
	task('build', [], function () {
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
