/**
 * @fileOverview The view context associated with the client side controller
 * @name View Context
 */
define(['core-components/client_util',
        'core-components/raintime/client_storage',
        'core-components/raintime/messaging_observer',
        'core-components/raintime/messaging'], function (ClientUtil, ClientStorage, Observer, Messaging) {
    "use strict";

    /**
     * The view context attached to this controller
     *
     * @param component
     *
     * @name ViewContext
     * @constructor
     */
    function ViewContext (component) {
        this.moduleId = component.moduleId;
        this.instanceId = component.id;
        this.parent = component.parent;
        this.storage = new ClientStorage(this);
    }

    /**
     * Method used to obtain a web socket for which a handler was defined into this
     * component.
     */
    ViewContext.prototype.getWebSocket = function (url) {
        return Messaging.messaging._getWebSocket(this.moduleId, url);
    };

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

    /**
     * This is the method that allows registration of a callback method to a
     * desired event.
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     */
    ViewContext.prototype.subscribe = function (eventName, callback) {
        Observer.subscribe(eventName, callback, this);
    };

    /**
     * Unsubscribe from an event
     *
     * @param eventName Event name we want to subscribe to. Can be any string value.
     * @param callback This is the callback method that will get executed. It must have
     *                     a single parameter called data.
     *             Ex: function(data)
     */
    ViewContext.prototype.unsubscribe = function (eventName, callback) {
        Observer.unsubscribe(eventName, callback, this);
    };

    /**
     * This is the method that will publish an event
     * and will execute all registered callbacks.
     *
     * @param eventName
     * @param data
     */
    ViewContext.prototype.publish = function (eventName, data) {
        Observer.publish(eventName, data, this);
    };

    return {
        addViewContext:function (component) {
            return new ViewContext(component);
        }
    };
});
