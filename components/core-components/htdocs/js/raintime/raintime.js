define(["core-components/client_util",
        "core-components/raintime/viewcontext",
        "core-components/raintime/messaging"], function (ClientUtil) {

    var modules = Array.prototype.splice.call(arguments, 1);

    var Raintime = (function () {

        function Component(id) {
            this.id = id;
            this.controller = null;
            this.parent = null;
            this.children = [];
        }

        Component.prototype = {
            addParent: function (o) {
                this.parent = o;
            },
            addChild: function(o) {
                this.children.push(o);
            }
        }

        var _id = 0;

        function createComponent(id) {
            return new Component(id || ("id" + (++_id)));
        }

        ComponentController = (function () {
            var _instance;

            function init () {
                function preRender(id) {
                    console.log("preRender " + id);
                }

                function postRender(id) {
                    console.log("postRender " + id);
                }

                function init(id) {
                    console.log("init component " + id);
                }

                return {
                    preRender:preRender,
                    postRender:postRender,
                    init:init
                };
            }

            return {
                get: function() {
                    return _instance || (_instance = init());
                }
            };
        })();

        ComponentRegistry = (function () {
            var _instance;

            function init() {
                var components = {};

                /**
                 * @param props Properties of the component: renderer_id, domId,
                 * instanceId, domselector, clientcontroller
                 */
                function register(props) {
                    var id = props.domId,
                        controllerpath = props.clientcontroller;

                    console.log("register component " + id);

                    if (components[id]) {
                        return;
                    }

                    var component = components[id] = createComponent(id);

                    require([controllerpath], function (controller) {
                        component.controller = controller;
                        component.controller.viewContext = Raintime.addViewContext(component);                        
                        component.controller.viewContext.getSession = ClientUtil.getSession;
                        component.controller.clientRuntime = Raintime;

                        console.log("registered component " + id);

                        if (controller.init) {
                            controller.init();
                        }
                    });

                    return component;
                }

                function deregister(id) {
                    delete components[id];
                }
                
                return {
                    components: components,
                    register: register,
                    deregister: deregister                    
                };
            }

            return {
                get: function() {
                    return _instance || (_instance = init());
                }
            };
        })();

        return {
            createComponent: createComponent,
            ComponentRegistry: ComponentRegistry.get(),
            ComponentController: ComponentController.get()
        };
    })();

    for (var m in modules) {
        var module = modules[m];

        ClientUtil.inject(Raintime, module);
    }

    return Raintime;
});
