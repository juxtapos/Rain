define(['core-components/client_util',
        'core-components/raintime/client_storage',
        'core-components/raintime/messaging_observer'],  function (ClientUtil, ClientStorage, Observer) {
    function ViewContext (comp) {
        this.moduleId = comp.id;
        this.instanceId = comp.id;
        this.parent = comp.parent;
        this.storage = new ClientStorage(this);
    }
    
    /**
     * Returns the DOM container element for the component associated with this
     * view context.
     * 
     * @param {Boolean} dom True to return the DOM element
     * @returns {HtmlElement} The component's container element
     */
    ViewContext.prototype.getRoot = function (dom) {
       var el = $("*[data-instanceid='" + this.instanceId + "']"); 

       return dom ? el.get() : el;
    };

    ViewContext.prototype.subscribe = function (eventName, callback) {
        Observer.subscribe(eventName, callback, this);
    };

    ViewContext.prototype.unsubscribe = function (eventName, callback) {
        Observer.unsubscribe(eventName, callback, this);
    };

    ViewContext.prototype.publish = function (eventName, data) {
        Observer.publish(eventName, data, this);
    };

    return {
        addViewContext:function (component) {
            return new ViewContext(component);
        }
    }
});
