var Raintime = (function () {

	function Component (id) {
		this.id = id;
		this.controller;
		this.parent = null;
		this.children = [];
	}

	Component.prototype = {
		addParent : function (o) {
			this.parent = o;
		},
		addChild : function (o) {
			this.children.push(o);
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

		this.register = function (id, domselector, controllerpath) {
			console.log('registering component ' + id);
			if (components[id]) {
				return;
			}
			return (function () {
				var comp = createComponent(id);
				components[id] = comp;
				require([controllerpath], function (obj) {
					comp.controller = obj;
                    Raintime.addViewContext(obj, id);
					console.log('rsegistered component ' + id);
					if (obj.init) {
						obj.init();
					}
				});
				return comp;
			})();
		};

        this.getComponents = function () {
            return components;
        }

		this.deregister = function () {
			delete components[id];
		};
	}

	return {
		createComponent : createComponent,
		ComponentRegistry : new ComponentRegistry(),
		ComponentController : new ComponentController(),
        addViewContext: null
		//Logger : new Logger(),
	}
})();

if (typeof exports != 'undefined') {
	var c = Raintime.createComponent();
	c.addParent('foo');
	console.log(c);
}
