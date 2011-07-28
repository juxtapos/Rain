var c = console.log
	,mod_events = require('events')
	,mod_util = require('util')

exports.send = function () {
	c('send msg');
	exports.component.messages.emit('event', 1, 2, 3)
}

function Component() {
	
}
mod_util.inherits(Component, mod_events.EventEmitter);

exports.component = {
	init : function (main) {
		c('init tc1');	
		c(main)
	}

	, stop : function () {
		c('stop tc2');
	}

	, messages : new Component()
}

c('test component 1 loaded');