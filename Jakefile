var child = require('child_process');

desc('Print the help message');
task('default', function (params) {
	jake.showAllTaskDescriptions();
});

namespace('doc', function () {
	namespace('client', function () {
		desc('Generate the client documentation');
		task('generate', function () {
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
			
			jsdoc.on('exit', function () {
				console.log('Done ...');
			});
		});
	});

	namespace('server', function () {
		desc('Generate the server documentation');
		task('generate', function () {
			console.log('Generating RST documntation');
			var args = [
				'-jar',
				'./tools/jsdoc-toolkit/jsrun.jar',
				'./tools/jsdoc-toolkit/app/run.js',
				'-c=./tools/jsdoc-toolkit/server.conf',
			];
	
			var jsdoc = child.spawn('java', args);

			jsdoc.stdout.on('data', function (data) {
				var buffer = new Buffer(data);
				console.log(buffer.toString());
			});

			jsdoc.stderr.on('data', function (data) {
				console.log('Error: ' + data);
			});
			
			jsdoc.on('exit', function () {
				console.log('Done ...');
			});
		});
	});

	desc('Build the client documentation');
	task('build', function () {
		console.log('Building documentation');
		child.exec('make clean', {cwd: './doc', env: process.env}, function (error, stdout, stderr) {
			console.log(stdout);
		});
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
