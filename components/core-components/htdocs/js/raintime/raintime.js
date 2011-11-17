var Raintime = (function () {

	function Component (id) {
		this.id = id;
		this.controller;
		this.parent = null;
		this.childs = [];
	}

	Component.prototype = {
		addParent : function (o) {
			this.parent = o;
		},
		addChild : function (o) {
			this.childs.push(o);
		}
	}

	var _id = 0;
	function createComponent(id) {
		var id = id ? id : 'id' + (++_id);
		return new Component(id);
	}

	function ComponentController () {

		this.preRender = function (id) {
			console.log('preRender ' + id);	
		}
			
		this.postRender = function (id) {
			console.log('postRender ' + id);	
		};
 
		this.init = function (id) {
			console.log('init component ' + id);	
		};
	}

	function ComponentRegistry () {
		var components = {};

		/**
		 * @param props object = renderer_id
		 *                       domId
		 *                       instanceId
		 *                       domselector???
		 *                       clientcontroller
		 */
		this.register = function (props) {
		    var id = props.renderer_id
		        , domselector = props.domselector
		        , controllerpath = props.clientcontroller
			console.log('register component ' + id);
			if (components[id]) {
				return;
			} 
			return (function () {
				var comp = createComponent(id);
				components[id] = comp;
				require([controllerpath], function (obj) {
					comp.controller = obj;
                    comp.controller.viewContext = Raintime.addViewContext(id);
					console.log('registered component ' + id);
					if (obj.init) {
						obj.init();
					}
				});
				return comp;
			})();
		}

		this.deregister = function () {
			delete components[id];
		}
	}

	return {
		createComponent : createComponent,
		ComponentRegistry : new ComponentRegistry(),
		ComponentController : new ComponentController(),
		//Logger : new Logger(),
	}
})();

if (typeof exports != 'undefined') {
	var c = Raintime.createComponent();
	c.addParent('foo');
	console.log(c);
}
