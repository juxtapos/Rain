var net = require('net');
var path = require('path');
var sys = require('sys');
var Worker = require('webworker/webworker').Worker;

var NUM_WORKERS = 5;

var workers = [];
var numReqs = 0;

for (var i = 0; i < NUM_WORKERS; i++) {
workers[i] = new Worker(path.join(__dirname, 'worker.js'));
}

net.createServer(function(s) {
s.pause();

var hv = 0;
s.remoteAddress.split('.').forEach(function(v) {
hv += parseInt(v);
});

var wid = hv % NUM_WORKERS;

sys.debug('Request from ' + s.remoteAddress + ' going to worker ' + wid);

workers[wid].postMessage(++numReqs, s.fd);
}).listen(80);


