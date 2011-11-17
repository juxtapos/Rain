(function (exports) {
    function ClientStorage (viewContext) {
        this.context = viewContext.instanceId;
    }

    /**
     * Set the value of key (add it if key doesn't exist) into storage
     *
     * @param {String} key
     * @param {String} value
     * @param {Boolean} isTransient whether to use persistent storage or transient storage (defaults to false)
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.set = function (key, value, isTransient) {
        var storage = null;

        if (window.localStorage) {
            storage = window.localStorage;
        }

        if (isTransient && window.sessionStorage) {
            storage = window.sessionStorage;
        }

        if (!storage) {
            throw new Error('Your browser doesn\'t support client storage');
        }

        storage.setItem(/*this.context + '-' + */key, value);
    };

    /**
     * Retrieves the value of key from storage
     * @param {String} key
     * @param {Boolean} isTransient whether to use persistent storage or transient storage (defaults to false)
     * @returns {String|Boolean} the value of key or null on failure
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.get = function (key, isTransient) {
        var storage = null
           ,value = '';

        if (window.localStorage) {
            storage = window.localStorage;
        }

        if (isTransient && window.sessionStorage) {
            storage = window.sessionStorage;
        }

        if (!storage) {
            throw new Error('Your browser doesn\'t support client storage');
        }

        value = storage.getItem(/*this.context + '-' + */key);

        return (value || null);

    };

    /**
     * Remove the key from storage
     *
     * @param {String} key
     * @param {Boolean} isTransient whether to use persistent storage or transient storage (defaults to false)
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.remove = function (key, isTransient) {
        var storage = null;

        if (window.localStorage) {
            storage
                = window.localStorage;
        }

        if (isTransient && window.sessionStorage) {
            storage = window.sessionStorage;
        }

        if (!storage) {
            throw new Error('Your browser doesn\'t support client storage');
        }

        storage.removeItem(key);
    };

    ClientStorage.prototype.addListener = function(callback) {
        // TODO: code here later
    };

    ClientStorage.prototype.removeListener = function (callback) {
        // TODO: code here
    };

    function ViewContext (id) {
        this.moduleId = id;
        this.instanceId = id;
        this.storage = new ClientStorage(this);
        this.storage.set()
    }

    exports.addViewContext = function (controller, id) {
        if (!controller.viewContext) {
            controller.viewContext = new ViewContext(id);
        }
    }
}) (Raintime);
