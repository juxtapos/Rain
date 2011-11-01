var Raintime = {};
Raintime.ComponentManager = (function () {
	
	function preRender (id) {
		console.log('preRender ' + id);
	}

	function postRender (id) {
		console.log('postRender ' + id);
	}

	function init (id) {
		console.log('init component ' + id);
	}

	return {
		preRender 	: preRender,
		postRender	: postRender
	}
})();