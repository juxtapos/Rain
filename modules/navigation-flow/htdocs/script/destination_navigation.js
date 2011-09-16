define(function() {
	function init(eid, params) {
		alert(JSON.stringify(params));
	}
	
	function load() {}
	
	function start() {}
	
	function pause() {}
	
	function stop() {}
	
	function dispose() {}
	
	return {
		init : init,
		load : load,
		start : start,
		pause : pause,
		stop : stop,
		dispose : dispose
	};
});