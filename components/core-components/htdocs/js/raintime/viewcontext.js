define(["core-components/client_util",
        "core-components/raintime/client_storage",
        "core-components/raintime/messaging_observer",
        "core-components/raintime/subsequent_views"], function (ClientUtil, ClientStorage, Observer, SubsequentViewHandler) {
    /**
     * A view context reflects a components client-side state.
     * @constructor
     * @property moduleId The component's module id
     * @property instanceId The component's instance id
     * @property {ClientStorage} storage The local storage manager
     * @property {SubsequentViewHandler} viewHandler The handler for subsequent view requests
     * @param component
     * @param component.id
     * @param component.parent
     */
    function ViewContext(component) {
        this.moduleId = component.id;
        this.instanceId = componentid;
        this.parent = component.parent;
        this.storage = new ClientStorage(this);
        this.viewHandler = new SubsequentViewHandler(this);
    }

    /**
     * Returns the DOM container element for the component associated with this view context.
     * @returns The component's container element
     */
    ViewContext.prototype.getRoot = function (dom) {
       return $("[data-instanceid='" + this.instanceId + "']"); 
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
        addViewContext: function (component) {
            return new ViewContext(component);
        }
    }
});
