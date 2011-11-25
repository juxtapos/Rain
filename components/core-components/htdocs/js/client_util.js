define(["core-components/jquery-cookie"], function () {
    /**
     * @class Utility class for client-side Rain.
     */
	return (function ClientUtil() {
        /**
         * A reusable empty function for inheritance.
         */
        function __empty() {};

        /**
         * Returns a new object that links to a given prototype object.
         * @param {Object} proto The prototype object to inherit from
         * @returns {Object} The object instance
         */ 
        function __create(proto) {
            var F = __empty;
            F.prototype = proto;
            return new F();
        }

        /**
         * Makes a function inherit from another's prototype.
         * @memberOf ClientUtil#
         */
        function inherits(ctor, superCtor) {
            ctor.__super__ = superCtor.prototype;
            ctor.prototype = __create(superCtor.prototype);
            ctor.prototype.constructor = ctor;
        }

        /**
         * Binds scope and arguments to a function.
         * All arguments passed after scope are considered bound.
         * Arguments passed to the binder function at call-time are also passed through at the
         * end of the parameter list, after the original bound parameters.
         * @memberOf ClientUtil#
         * @param {Function} f The function to which scope and/or arguments are bound
         * @param scope The scope to bind to the function
         */
        function bind(f, scope) {
            if (typeof f !== "function") {
                throw new TypeError("expected f to be a function");
            }

            var args = Array.prototype.slice.call(arguments, 2);

            return function g() {
                for (var i = 0, l = arguments.length; i < l; i++) {
                    args.push(arguments[i]);
                }
                return f.apply(scope, args);
            }
        }

        /**
         * Decorate a function with advice.
         * Use {@link #bind} to bind the advice functions to the desired scope.
         * @memberOf ClientUtil#
         * @param {Function} f Function to be decorated
         * @param advice Holds advice functions
         * @param {Function} [advice.before] An advice (function) to insert before the actual call
         * @param {Function} [advice.after] An advice (function) to insert after the actual call
         * @param {Function} [advice.exception] An advice (function) to call in case of an
         * exception being thrown from the original function
         */
        function decorate(f, advice) {
            if (typeof f !== "function") {
                throw new TypeError("expected f to be a function");
            }

            function g(before, after) {
                before && before();
                f();
                after && after();
            }

            function h(g, handle) {
                try {
                    g();
                } catch (e) {
                    handle(e);
                }
            }

            if (!advice) {
                return f;
            }

            ["before", "after", "exception"].forEach(function (type) {
                if (advice[type] && typeof advice[type] !== "function") {
                    throw new TypeError("Expected advice." + type + " to be a function");
                }
            });

            return advice.exception ? bind(h, bind(g, null, before, after), advice.exception)
                                    : bind(g, null, before, after);
        }

        /**
         * Inject the properties from one object into another.
         * Useful for borrowing methods.
         * @memberOf ClientUtil#
         * @param on The object which borrows the properties
         * @param from The object which lends the properties
         */
        function inject(on, from) {
            for (var key in from) {
                if (from.hasOwnProperty(key)) {
                    on[key] = from[key];
                }
            }

            return on;
        }

        /**
         * @memberOf ClientUtil#
         */
        function getSession() {
            return $.cookie("rain.sid");
        }

        /**
         * Defer the execution of a function until the first possible moment to run it.
         * Use {@link #bind} to bind scope and arguments to the function.
         * @memberOf ClientUtil#
         * @param {Function} f The function to defer
         */
        function defer(f) {
            setTimeout(f, 0);
        }

        /**
         * @lends ClientUtil
         */
        return {
            inherits: inherits,
            bind: bind,
            decorate: decorate,
            inject: inject,
            getSession: getSession,
            defer: defer
        };
    })();
});
