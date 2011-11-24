/*
Copyright (c) 2011, Cosnita Radu Viorel <radu.cosnita@1and1.ro>
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
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 21.11.2011
 * @description This module provides intents client methods that are automatically
 * binded to messaging layer.
 */

define(["core-components/client_util", 
        "core-components/jquery-cookie"], function(ClientUtil) {
    /**
     * Class used to implement client intents object.
     */
    function ClientIntents(config) {                
        this._config = config;

        var webSocketsCfg = config.rain_websockets;

        var intentsUrl = this._getIntentsSocketUrl(webSocketsCfg);

        this._intentsSocket = io.connect(intentsUrl);
        
        this._requestCounter = 0;
    }

    ClientIntents.INTENT_SOCKET = "/intents";

    /**
     * Class used to obtain the intents socket url from the configuration.
     */
    ClientIntents.prototype._getIntentsSocketUrl = function(webSocketsCfg) {
        var intentsUrl = [];

        intentsUrl.push(webSocketsCfg.rain_websockets_url);
        intentsUrl.push(":");
        intentsUrl.push(webSocketsCfg.rain_websockets_port);
        intentsUrl.push(webSocketsCfg.rain_websockets_namespace);
        intentsUrl.push(ClientIntents.INTENT_SOCKET);

        return intentsUrl.join("");
    }
    
    /**
     * Method used to send an intent request.
     *
     * @param {Dictionary} request: This is the request object for this intent.
     * @throws Error: if request object is incomplete then sendIntent raises an error.
     *
     * @example:
     * var request = {"viewContext": <viewcontext instance>,
     *                "category": "....",
     *                "action": "....",
     *                "intentContext": {....},
     *                "success": function(data) {.....},
     *                "error": function(error) {....}};
     *
     * clientRuntime.messaging.sendIntent(request);
     */
    ClientIntents.prototype.sendIntent = function(request) {
        if(!this._validateIntentRequest(request)) {
            return;
        }

        this._requestCounter++;
        
        var session = ClientUtil.getSession();
        var requestId = session + this._requestCounter;

        request.session = session;
        request.requestId = requestId;
        
        this._requestIntent(request);
        this._handleError(request);
        this._handleIntentLoaded(request);
    }
    
    /**
     * Method used to validate the requests object.
     */
    ClientIntents.prototype._validateIntentRequest = function(request) {
        var ex;

        var errorHandler = request.error || this._errorHandlerDefault

        if(!request.viewContext) {
            ex = new Error("View context not specified.");
        } else if(!request.category) {
            ex = new Error("Intent category not specified.");
        } else if(!request.action) {
            ex = new Error("Intent action not specified.");
        }

        if(ex) {
            errorHandler(ex);
            
            return false;
        }
        
        return true;
    }
    
    /**
     * This is the default error handler if request did not register one.
     */
    ClientIntents.prototype._errorHandlerDefault = function(errMessage) {
        throw errMessage;
    }
    
    ClientIntents.prototype._successHandlerDefault = function(data) {
        alert(data);
    }
    
    /**
     * Method used to emit an request intent event.
     */
    ClientIntents.prototype._requestIntent = function(request) {
        var viewContext = {"moduleId": request.viewContext.moduleId,
                           "instanceId": request.viewContext.instanceId};        
        this._intentsSocket.emit("request_intent", 
                {
                    intentCategory: request.category,
                    intentAction: request.action,
                    intentContext: request.intentContext || {},
                    session: request.session,
                    requestId: request.requestId
                });
    }
    
    /**
     * Method used to handle intent_loaded event.
     */
    ClientIntents.prototype._handleIntentLoaded = function(request) {
        var successHandler = request.success || this._successHandlerDefault;
        
        var self = this;
        
        this._intentsSocket.on("intent_loaded", function(intentResponse) {
            if(request.requestId == intentResponse.requestId) {
                successHandler(intentResponse.data);
            }
        });
    }
    
    /**
     * Method used to handle error received from the intents socket. 
     */
    ClientIntents.prototype._handleError = function(request) {
        var self = this;
        
        this._intentsSocket.on("intent_exception", function(intentResponse) {
           var errorHandler = request.error || self._errorHandlerDefault; 
           
           if(request.requestId == intentResponse.requestId) {
                errorHandler(intentResponse.message);
           } 
        });
    }
        
    return {"intents": ClientIntents};
});