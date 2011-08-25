var spawn 		= require('child_process').spawn,
	c 			= console.log,
	CLIENTS		= 50
args = ['./host']
for (var i = 0; i < CLIENTS; i++) {
	var client = spawn('node', args);
	// client.stdout.on('data', function (data) {
	// 	var data = data.toString().trim();
	//  	c(data);
	// });
}

