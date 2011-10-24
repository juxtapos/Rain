define(function () 
{
	function initView(elementid, template, instance) {
		var data = {};
		console.log('initView weather ' + elementid);
		// console.log(instance)
		// if (typeof instance !== 'undefined') {	
		// 	data = JSON.parse(instance);
		// }
		// if (template.indexOf('{') === 0) {
		// 	template = JSON.parse(template).content;
		// } 
		
		// var d = $('*[id=' + elementid + ']').append('<div class="grunz">');
		// d.load('/modules/weather/controller/getWeatherData?location=' + data.woeid);
		//$.tmpl(template, { city : data.city } ).appendTo($('*[id=' + elementid + ']'));
	}

	function init () {
		initView();
	}

	function load () {}

	function start () {}

	function pause () {}

	function stop () {}

	function dispose () {}

	return {
		init 		: init,
		load 		: load, 
		start 		: start, 
		pause 		: stop, 
		stop 		: stop,
		dispose 	: dispose
	}
});