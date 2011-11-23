define(['core-components/client_util', 'core-components/raintime/client_storage'], function (ClientUtil, ClientStorage) {
    function ViewContext (id) {
        this.moduleId = id;
        this.instanceId = id;
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

    return {
        addViewContext:function (id) {
            return new ViewContext(id);
        }
    }
});
