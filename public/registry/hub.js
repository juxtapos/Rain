var redback         = require('redback'),
    redbackClient 	= redback.createClient(),
    http 			= require('http'),
    io 				= require('socket.io'),
    c             	= console.log,
    SOCKET_PORT 	= 7331,
    tagmanager    	= null

console.log('redis client started');
var channel = redbackClient.createChannel('rain.registry');

channel.subscribe(function (data) {
    c('subscribed ' + data);



    channel.on('message', function (msg) {
    	console.log(msg);
	});
});

// Start the server at port 8080
var server = http.createServer(function(req, res){ 

  // Send HTML headers and message
  res.writeHead(200,{ 'Content-Type': 'text/html' }); 
  res.end();
});
server.listen(SOCKET_PORT);

var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){ 
  
  // Success!  Now listen to messages to be received
  client.on('message',function(event){ 
    console.log('Received message from client!',event);
  });
  client.on('disconnect',function(){
    clearInterval(interval);
    console.log('Server has disconnected');
  });

  var interval = setInterval(function() {
  	client.send('This is a message from the server!  ' + new Date().getTime());
	},5000);

});

