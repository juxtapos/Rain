define(['core-components/client_util',
        'core-components/raintime/raintime_config', 
        'core-components/raintime/viewcontext',
        "core-components/raintime/messaging"], function (ClientUtil, RaintimeConfig) {	

    var modules = Array.prototype.splice.call(arguments, 1);

    var Raintime = (function () {

        function Component (ids) {
            this.id = ids.domId;
            this.instanceId = ids.instanceId;
            this.staticId = ids.staticId;
            this.moduleId = ids.moduleId;
            this.controller = null;
            this.state = this.STATE_LOAD;
            this.parent = null;
            this.children = [];
            $(this).trigger('changeState');
        }

        Component.prototype = {
            addParent:function (o) {
                this.parent = o;
            },
            addChild:function (o) {
                this.children.push(o);
            },
            
            bindState : function(state, callback){
                $(this).bind("changeState", this, function(){
                    if(state == this.state){
                        callback.call(this);
                    }
                });
            },
            
            STATE_INIT    : 'initialized',
            STATE_LOAD    : 'loaded',
            STATE_START   : 'started',
            STATE_PAUSE   : 'paused',
            STATE_STOP    : 'stopped',
            STATE_DISPOSE : 'disposed'
        }

        var _id = 0;

        function createComponent (ids) {
            return new Component(ids);
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
                        , controllerpath = props.clientcontroller
                        , instanceId = props.instanceId
                        , staticId = props.staticId;

                    console.log("register component " + id);

                    if (components[id]) {
                        return;
                    }
                                        
                    var component = components[id] = createComponent({
                          domId      : id
                        , instanceId : instanceId
                        , staticId   : staticId
                        , moduleId   : moduleId
                    });
                    
                    require([controllerpath], function (controller) {
                        component.controller = controller;
                        component.controller.viewContext = Raintime.addViewContext(component);
                        component.controller.viewContext.getSession = ClientUtil.getSession;
                        component.controller.clientRuntime = Raintime;

                        console.log("registered component " + id);

                        if (controller.init) {
                            controller.init();
                            component.state = component.STATE_INIT;
                            $(component).trigger('changeState');
                        }
                    });

                    return component;
                }
                
                function deregister (id) {
                    delete components[id];
                };
                
                function getComponent (staticId){
                    for(var key in components){
                        if(components[key].staticId == staticId){
                            return components[key];
                        }
                    }
                };
                
                return {
                    components:components,
                    register:register,
                    deregister:deregister,
                    getComponent:getComponent
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
