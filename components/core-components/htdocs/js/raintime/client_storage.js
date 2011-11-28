/*
 Copyright (c) 2011, Alexandru Bularca <alexandru.bularca@1and1.ro>
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * Neither the name of the <organization> nor the
 names of its contributors may be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @fileOverview Client side storage implementation
 * @name Client Storage
 */

define(['core-components/lib/amplify.store'], function (driver) {
    var storageTypes = {
        'persistent': [
            'localStorage',
            'globalStorage',
            'userData'
        ],
        'transient': [
            'sessionStorage',
            'memory'
        ]
    };

    function getStorage(type) {
        type = (type) ? 'transient' : 'persistent';

        for (var i in storageTypes[type]) {
            var storage = storageTypes[type][i];

            if(storage in driver.store.types) {
                return driver.store.types[storage];
            }
        }

        return driver.store;
    }

    /**
     * Client storage implementation
     *
     * @name ClientStorage
     * @constructor
     */
    function ClientStorage (viewContext) {
        this.context = viewContext.instanceId;
    }

    /**
     * Set the value of key (add it if key doesn't exist) into storage
     *
     * @param {String} key
     * @param {Object} value
     * @param {Boolean} [isTransient] whether to use persistent storage or transient storage (defaults to false)
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.set = function (key, value, isTransient) {
        var storage = getStorage(isTransient);

        storage(key, value, {expires: false});
    };

    /**
     * Retrieves the value of key from storage
     *
     * @param {String} key
     * @param {Boolean} [isTransient] whether to use persistent storage or transient storage (defaults to false)
     * @returns {String|Boolean} the value of key or null on failure
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.get = function (key, isTransient) {
        var storage = getStorage(isTransient);

        value = storage(key);

        return value;
    };

    /**
     * Remove the key from storage
     *
     * @param {String} key
     * @param {Boolean} [isTransient] whether to use persistent storage or transient storage (defaults to false)
     * @throws {Error} if client storage is not supported
     */
    ClientStorage.prototype.remove = function (key, isTransient) {
        var storage = getStorage(isTransient);

        storage(key, null);
    };

    ClientStorage.prototype.addListener = function (callback) {
        // TODO: code here later
    };

    ClientStorage.prototype.removeListener = function (callback) {
        // TODO: code here
    };

    return ClientStorage;
});
