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
        "core-components/socket.io/socket.io",
        "core-components/promised-io/promise",
        "core-components/jquery-cookie"], function(ClientUtil, SocketIO, Promise) {
    /**
     * Class used to implement client intents object.
     */
    function ClientIntents(config) {
        this._config = config;

        var webSocketsCfg = config.rain_websockets;

        var intentsUrl = this._getIntentsSocketUrl(webSocketsCfg);
        
        this._intentsSocket = SocketIO.io.connect(intentsUrl);
        
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
    ClientIntents.prototype.sendIntent = function(request, defer) {
        if(!this._validateIntentRequest(request, defer)) {
            return;
        }

        var defer = new Promise.defer();
                       
        this._requestCounter++;
        
        var session = ClientUtil.getSession();
        var requestId = session + this._requestCounter;

        request.session = session;
        request.requestId = requestId;
        
        this._requestIntent(request, defer);
        this._handleError(request, defer);
        this._handleIntentLoaded(request, defer);
                
        return defer.promise;
    }
    
    /**
     * Method used to validate the requests object.
     */
    ClientIntents.prototype._validateIntentRequest = function(request, defer) {
        var ex;

        if(!request.viewContext) {
            ex = new Error("View context not specified.");
        } else if(!request.category) {
            ex = new Error("Intent category not specified.");
        } else if(!request.action) {
            ex = new Error("Intent action not specified.");
        }

        if(ex) {
            defer.reject(ex);
            
            return false;
        }
        
        return true;
    }
        
    /**
     * Method used to emit an request intent event.
     */
    ClientIntents.prototype._requestIntent = function(request, defer) {
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
    ClientIntents.prototype._handleIntentLoaded = function(request, defer) {
        var self = this;
        
        this._intentsSocket.on("intent_loaded", function(intentResponse) {
            if(request.requestId == intentResponse.requestId) {
                defer.resolve(intentResponse.data);
            }
        });
    }
    
    /**
     * Method used to handle error received from the intents socket. 
     */
    ClientIntents.prototype._handleError = function(request, defer) {
        var self = this;
        
        this._intentsSocket.on("intent_exception", function(intentResponse) {
           if(request.requestId == intentResponse.requestId) {
                defer.reject(intentResponse.message);
           } 
        });
    }
        
    return {"intents": ClientIntents};
});