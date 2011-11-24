define(['core-components/client_util',
        'core-components/raintime/client_storage',
        'core-components/raintime/messaging_observer',
        'core-components/raintime/messaging'],  function (ClientUtil, ClientStorage, Observer, Messaging) {
    function ViewContext (comp) {
        this.moduleId = comp.moduleId;
        this.instanceId = comp.id;
        this.parent = comp.parent;
        this.storage = new ClientStorage(this);
    }
    
    /**
     * Method used to obtain a web socket for which a handler was defined into this
     * component.
     */
    ViewContext.prototype.getWebSocket = function(url) {
    	return Messaging.messaging._getWebSocket(this.moduleId, url);
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
