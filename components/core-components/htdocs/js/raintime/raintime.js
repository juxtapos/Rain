define(['core-components/client_util',
        'core-components/raintime/raintime_config', 
        'core-components/raintime/viewcontext',
        "core-components/raintime/messaging"], function (ClientUtil, RaintimeConfig) {	
    var modules = Array.prototype.splice.call(arguments, 1);

    var Raintime = (function () {

        function Component (id, moduleId) {
            this.id = id;
            this.moduleId = moduleId;
            this.controller = null;
            this.parent = null;
            this.children = [];
        }

        Component.prototype = {
            addParent:function (o) {
                this.parent = o;
            },
            addChild:function (o) {
                this.children.push(o);
            }
        }

        var _id = 0;

        function createComponent (id, moduleId) {
            id = id || ("id" + (++_id));
            
            return new Component(id, moduleId);
        }

        ComponentController = (function () {
            var _instance;

            function init () {
                function preRender (id) {
                    console.log("preRender " + id);
                }

                function postRender (id) {
                    console.log("postRender " + id);
                }

                function init (id) {
                    console.log("init component " + id);
                }

                return {
                    preRender:preRender,
                    postRender:postRender,
                    init:init
                };
            }

            return {
                get:function () {
                    return _instance || (_instance = init());
                }
            };
        })();

        ComponentRegistry = (function () {
            var _instance;

            function init () {
                var components = {};

                /**
                 * @param props Properties of the component: renderer_id, domId,
                 * instanceId, domselector, clientcontroller
                 */
                function register (props) {
                    var id = props.domId
                        , moduleId = props.moduleId
                        , domselector = props.domselector
                        , controllerpath = props.clientcontroller;

                    console.log("register component " + id);

                    if (components[id]) {
                        return;
                    }
                                        
                    var component = components[id] = createComponent(id, moduleId);
                    
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
                
                function deregister (id) {
                    delete components[id];
                }
                
                return {
                    components:components,
                    register:register,
                    deregister:deregister                    
                };
            }

            return {
                get:function () {
                    return _instance || (_instance = init());
                }
            };
        })();

        return {
            createComponent:createComponent,
            ComponentRegistry:ComponentRegistry.get(),
            ComponentController:ComponentController.get()
        };
    })();

    if (typeof exports != 'undefined') {
        var c = Raintime.createComponent();
        c.addParent('foo');
        console.log(c);
    }

    for (var i in modules) {
        var module = modules[i];

        ClientUtil.inject(Raintime, module);
    }

    return Raintime;
});
