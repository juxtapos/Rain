/**
 * This is a proof of concept for a working publish / subscriber mechanism
 * on client side.
 * 
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 27.08.2011 
 */
define(function() {
	function ClientQueue() {
		this.queue = {};
		this.queue_delayed = {}; // this holds all events for which no callback was registered.
	}
	
	/**
	 * This is the method that will publish an event
	 * and will execute all registered callbacks. If no
	 * registered callbacks are found it will be kept in a separate
	 * queue and when a consumer appear it will get notified. 
	 * 
	 * @param eventName
	 * @param data
	 */
	function publish(eventName, data) {
		/**
		 * Nobody is registered for this event so we simply exit this method.
		 */
		if(!this.queue[eventName]) {
			this.queue_delayed[eventName] = data;
			
			return;
		}
		
		for(i = 0; i < this.queue[eventName].length; i++) {
			this.queue[eventName][i](data);
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
		if(!this.queue[eventName]) {
			this.queue[eventName] = [];
		}
		
		if(this.queue[eventName].indexOf(callback) == -1) {
			this.queue[eventName].push(callback);
		}
		
		if(this.queue_delayed[eventName]) {
			alert("Queue delayed hit.");
			callback(this.queue_delayed[eventName]);
		}
	}
	
	/**
	 * Method used to unsubscribe a listener from an event.
	 */
	function unsubscribe(eventName, callback) {
		if(!this.queue[eventName]) {
			return;
		}
		
		var foundIndex = -1;
		
		for(i = 0; i < this.queue[eventName].length; i++) {
			if(this.queue[eventName][i] == callback) {
				foundIndex = i;
				break;
			}
		}
		
		if(foundIndex > -1) {			
			this.queue[eventName].splice(foundIndex, 1);
		}
	}
	
	ClientQueue.prototype.publish = publish;
	ClientQueue.prototype.subscribe = subscribe;
	ClientQueue.prototype.unsubscribe = unsubscribe;
	
	var currentQueue = new ClientQueue();
	
	/**
	 * We return an instance of a queue to be used at page level.
	 */
	return {currentQueue : currentQueue};
});