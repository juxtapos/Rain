var c = console.log;

msg = function () {
	c('tc2 message received ');
}

exports.component = {
	init : function (main) {
		c('init tc2');

		var tc1 = main.serviceById('tc1').component.messages.addListener('event', msg);

		c(main)
	}

	, stop : function () {
		c('stop tc2');
	}
}

c('test component 2 loaded');