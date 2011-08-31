/*
Copyright (c) 2011, Radu Viorel Cosnita <radu.cosnita@gmail.com>

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
 * This is the session object on client side. It gives transparent access
 * to rain session. For each method we can pass a successCallback and an
 * errorCallback method. These methods must accept a single parameter.
 */
define(function() { 
	function ClientSession() {
		this._expirePeriod = 1; // expire in 1 days.
		this._sessionCookieName = "sessionId";
		
		require(["/modules/core-components/htdocs/js/require-jquery-cookie.js"], function(module) {
			var identifier = $.cookie(parentObj._sessionCookieName);
			identifier = identifier == null ? undefined : identifier;
			
			parentObj.sessionId =  identifier;
		});
		
		this._baseUrl = "/modules/core-components/controller/session/session_rest.js"; 
	}
	
	/**
	 * Method used to send a create session request.
	 * 
	 * @param succesCallback Method to be invoked on success.
	 * @param errorCallback Method to be invoked on error.
	 */
	function createSession(successCallback, errorCallback) {
		alert("Create: " + parentObj.sessionId);
		
		var url = parentObj._baseUrl;
		
		if(parentObj.sessionId) {
			url += "?sessionId=" + parentObj.sessionId;
		}
		
		$.ajax({
			url : url,
			contentType : "application/json",
			type: "PUT",
			success : function(data, textStatus, jqXHR) {
				parentObj.sessionId = JSON.parse(data).sessionId;
				$.cookie(parentObj._sessionCookieName, parentObj.sessionId, 
						parentObj._expirePeriod);
				
				if(successCallback) {
					successCallback(textStatus);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(errorCallback) {
					errorCallback(errorThrown);
				}
			}
		});
	}
	
	/**
	 * Method used to obtain a value for the current session.
	 *
	 * @param key
	 * @param value
	 * @param succesCallback Method to be invoked on success. It will receive returned value of the key.
	 * @param errorCallback Method to be invoked on error. It will receive the exception thrown.
	 */
	function getValue(key, successCallback, errorCallback) {
		$.ajax({
			url : this._baseUrl,
			type : "GET",
			data : {"sessionId" : this.sessionId,
					"key" : key},
			success : function(data, textStatus, jqXHR) {
				if(successCallback) {
					successCallback(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(errorCallback) {
					errorCallback(errorThrown);
				}
			}
		});
	}
	
	/**
	 * Method used to set a value for the current session.
	 *
	 * @param key Key that we want to set within my session.
	 * @param value Value that we want to assign.
	 * @param succesCallback Method to be invoked on success. No parameter will be populated.
	 * @param errorCallback Method to be invoked on error. Only error will be passed.
	 */
	function setValue(key, value, successCallback, errorCallback) {
		$.ajax({
			url : this._baseUrl,
			type : "POST",
			data : {"sessionId" : this.sessionId,
					"key" : key,
					"value" : value},
		    success: function(data, textStatus, jqXHR) {
		    	if(successCallback) {
		    		successCallback();
		    	}
		    },
		    error : function(jqXHR, textStatus, errorThrown) {
		    	alert(errorThrown);
		    }
		});
	}
	
	/**
	 * Method used to return the current session id.
	 */
	function getSessionId() {
		return this.sessionId;
	}
	
	ClientSession.prototype.createSession = createSession;
	ClientSession.prototype.setValue = setValue;
	ClientSession.prototype.getValue = getValue;
	ClientSession.prototype.getSessionId = getSessionId;
	
	var session = new ClientSession();
	var parentObj = session;
	
	return {currentSession : session};
});