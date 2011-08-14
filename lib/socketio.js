"use strict";

/**
 * This does not work yet as the connection is lost on re-loading the server.
 * Client reload should go into the 'demon' script (to be build from the ashes of run.js)
 */
 
function init (io) {
	io.sockets.on('connection', function (socket) {
		console.log('client connected');
		socket.on('rain.application.state', function (from, msg) {
	    	console.log('rain.application.state message', from, ':', msg);
		});

		socket.on('disconnect', function () {
			io.sockets.emit('user disconnected');
		});
	});
}

function send (io) {
	console.log('send reload request');
	io.sockets.emit('rain.application.reload', { 'reload' : true } );
}

exports.init = init;