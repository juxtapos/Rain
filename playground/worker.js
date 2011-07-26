var http = require('http');
var net = require('net');
var sys = require('sys');

process.setuid('nobody');

var srv = http.createServer(function(req, resp) {
	resp.writeHead(200, {'Content-Type' : 'text/plain'});
	resp.write(
	'process=' + process.pid +
	'; reqno=' + req.connection.reqNo + '\n'
	);
	resp.end();
});

onmessage = function(msg) {
	var s = new net.Stream(msg.fd);
	s.type = srv.type;
	s.server = srv;
	s.resume();

	s.reqNo = msg.data;

	srv.emit('connection', s);
};

