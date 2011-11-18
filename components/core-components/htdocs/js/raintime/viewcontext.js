define(['core-components/client_util', 'core-components/raintime/client_storage'], function (ClientUtil, ClientStorage) {
    function ViewContext (id) {
        this.moduleId = id;
        this.instanceId = id;
        this.storage = new ClientStorage(this);
    }

    return {
        addViewContext:function (controller, id) {
            return new ViewContext(id);
        }
    }
});
