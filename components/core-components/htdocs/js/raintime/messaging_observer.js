/**
 * This is a proof of concept for a working publish / subscriber mechanism
 * on client side.
 * 
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 27.08.2011 
 */
define(['core-components/client_util'], function(ClientUtil) {
    /** @private */
    var queue = {};

    /** @private */
    var orphans = {};
	
	/**
	 * This is the method that will publish an event
	 * and will execute all registered callbacks. 
	 * 
	 * @param eventName
	 * @param data
	 */
	function publish(eventName, data, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];

            if (!parent) {
                break;
            }

            parent = parent[child];
        }

        /**
         * Nobody is registered for this event so we simply exit this method.
         */
        if (!parent) {
            // take care of published events that no one subscribed to
            orphans[eventName] = data;

            return;
        }
		
		for(i = 0; i < parent.callbacks.length; i++) {
            ClientUtil.callAsync(parent.callbacks[i], data);
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
	function subscribe(eventName, callback, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        // take care of the orphaned events
        if(orphans.hasOwnProperty(eventName)) {
            callback(orphans[eventName]);

            delete orphans[eventName];
        }

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];
            if (!parent[child]) {
                parent[child] = {
                    callbacks: []
                }
            }

            parent = parent[child];
        }

        if (parent.callbacks.indexOf(callback) === -1) {
            parent.callbacks.push(callback);
        }
	}
	
	/**
	 * Method used to unsubscribe a listener from an event.
	 */
	function unsubscribe(eventName, callback, viewContext) {
        var hierarchy = eventName.split('::');
        var parent = queue;

        if (hierarchy[0] && viewContext && viewContext.parent) {
            // prepend parent
            hierarchy.splice(0, 0, viewContext.parent);
        } else {
            hierarchy.slice(1);
        }

        for (var i = 0, len = hierarchy.length; i < len; i++) {
            var child = hierarchy[i];
            if (!parent[child]) {
                return;
            }

            parent = parent[child];
        }

		var foundIndex = parent.callbacks.indexOf(callback);
		
		if(foundIndex > -1) {			
			parent.callbacks.splice(foundIndex, 1);
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
