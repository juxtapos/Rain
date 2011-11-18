/**
 * @author Radu Viorel Cosnita
 * @version 1.0
 */

define(function(require) {
	function ClientUtil() { }
		
	ClientUtil.prototype._create = function(proto) {
		function F() { };
		
		F.prototype = proto;
		
		return new F();		
	}
	
	ClientUtil.prototype.inherits = function(ctor, superCtor) {
	  ctor.super_ = superCtor;
	  ctor.prototype = this._create(superCtor.prototype);
	}	   	
	
	var clientUtil = new ClientUtil();
	
	return {"_create": clientUtil._create,
			"inherits": clientUtil.inherits};
});