/**
 * @author Radu Viorel Cosnita
 * @version 1.0
 */

define(function (require) {
    function ClientUtil () {
    }

    ClientUtil.prototype._create = function (proto) {
        function F () {
        };

        F.prototype = proto;

        return new F();
    }

    ClientUtil.prototype.inherits = function (ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = this._create(superCtor.prototype);
    }

    ClientUtil.prototype.inject = function (destination, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                destination[key] = source[key];
            }
        }

        return destination;
    }

    /*var clientUtil = new ClientUtil();

     return {"_create":clientUtil._create,
     "inherits":clientUtil.inherits};*/

    return new ClientUtil();
});
