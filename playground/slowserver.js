var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
	setTimeout(function (){
  res.end('Hello World\n');
}, 2000);
}).listen(1338, "127.0.0.1");
console.log('slow server started');
