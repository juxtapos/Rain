(function (exports) {
    function ClientStorage (viewContext) {
        this.context = viewContext.instanceId;
    }

    ClientStorage.prototype.setValue = function (key, value, transient) {
        var storage = null;

        if (window.localStorage) {
            storage = window.localStorage;
        }

        if (transient && window.sessionStorage) {
            storage = window.sessionStorage;
        }

        if (!storage) {
            return false;
        }

        storage.setItem(/*this.context + '-' + */key, value);

        return true;
    }

    ClientStorage.prototype.getValue = function (key, transient) {
        var storage = null
           ,value = '';

        if (window.localStorage) {
            storage = window.localStorage;
        }

        if (transient && window.sessionStorage) {
            storage = window.sessionStorage;
        }

        if (!storage) {
            return false;
        }

        value = storage.getItem(/*this.context + '-' + */key);

        return (value || null);

    }

    function ViewContext (id) {
        this.moduleId = id;
        this.instanceId = id;
        this.storage = new ClientStorage(this);
    }

    exports.addViewContext = function (controller, id) {
        if (!controller.viewContext) {
            controller.viewContext = new ViewContext(id);
        }
    }
}) (Raintime);
