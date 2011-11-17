var Raintime = (function () {

	function Component(id) {
		this.id = id;
		this.controller = null;
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
		return new Component(id || ("id" + (++_id)));
	}

	ComponentController = (function () { 
        var _instance;

        function init() {
            return {
                preRender: function (id) {
                    console.log("preRender " + id);	
                },

                postRender: function (id) {
                    console.log("postRender " + id);	
                },

                init: function (id) {
                    console.log('init component ' + id);	
                }
            };
        }

        return {
            get: function () {
                return _instance || (_instance = init());
            }
        };
	})();

    ComponentRegistry = (function () {
        var _instance;

        function init() {
            var components = {};

            return {
                register: function (id, domSelector, controllerPath) {
                    console.log("register component " + id);

                    if (components[id]) {
                        return;
                    }

                    var component = components[id] = createComponent(id);

                    require([controllerPath], function (controller) {
                        component.controller = controller;
                        console.log("registered component " + id);

                        if (controller.init) {
                            controller.init();
                        }
                    });

                    return component;
                },

                deregister: function () {
                    delete components[id];
                }
            };
        }

        return {
            get: function () {
                return _instance || (_instance = init());
            }
        };
    })();

	return {
		createComponent : createComponent,
		ComponentRegistry : ComponentRegistry.get(),
		ComponentController : ComponentController.get()
	};
})();

if (typeof exports != 'undefined') {
	var c = Raintime.createComponent();
	c.addParent('foo');
	console.log(c);
}
