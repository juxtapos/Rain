/**
 * This is a proof of concept for a working publish / subscriber mechanism
 * on client side.
 * 
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 27.08.2011 
 */
define(function() {
    /** @private */
    var queue = {};
	
	/**
	 * This is the method that will publish an event
	 * and will execute all registered callbacks. 
	 * 
	 * @param eventName
	 * @param data
	 */
	function publish(eventName, data) {
		/**
		 * Nobody is registered for this event so we simply exit this method.
		 */
		if(!this.queue[eventName]) {
			return;
		}
		
		for(i = 0; i < queue[eventName].length; i++) {
			queue[eventName][i](data);
		}
	}
	
	/**
	 * This is the method that allows registration of a callback method to a 
	 * desired event.
	 * 
	 * @param eventName Event name we want to subscribe to. Can be any string value.
	 * @param callback This is the callback method that will get executed. It must have
	 * 					a single parameter called data. 
	 * 			Ex: function(data)
	 */
	function subscribe(eventName, callback) {
		if(!queue[eventName]) {
			queue[eventName] = [];
		}
		
		if(~queue[eventName].indexOf(callback)) {
			queue[eventName].push(callback);
		}
	}
	
	/**
	 * Method used to unsubscribe a listener from an event.
	 */
	function unsubscribe(eventName, callback) {
		if(!queue[eventName]) {
			return;
		}
		
		var foundIndex = -1;
		
		for(i = 0; i < this.queue[eventName].length; i++) {
			if(queue[eventName][i] == callback) {
				foundIndex = i;
				break;
			}
		}
		
		if(foundIndex > -1) {			
			queue[eventName].splice(foundIndex, 1);
		}
	}

	/**
	 * We return an instance of a queue to be used at page level.
	 */
	return {
        'publish': publish,
        'subscribe': subscribe,
        'unsubscribe': unsubscribe
    };
});
