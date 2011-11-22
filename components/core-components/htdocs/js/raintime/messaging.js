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
 * @since 22.11.2011
 * @description This is the messaging layer of Raintime. It contains useful methods for working
 * with intents and pub / sub mechanism.
 */
define(["core-components/raintime/raintime_config"], function(RaintimeConfig) {
    /**
     * Class used to build the messaging layer.
     */
    function Messaging(config) {
        this._config = config;
        
        var webSocketsCfg = config.rain_websockets;
        
        var intentsUrl = this._getIntentsSocketUrl(webSocketsCfg);
               
        this._intentsSocket = io.connect(intentsUrl);
    }
    
    Messaging.INTENT_SOCKET = "/intents";
    
    Messaging.prototype._getIntentsSocketUrl = function(webSocketsCfg) {                
        var intentsUrl = [];
        
        intentsUrl.push(webSocketsCfg.rain_websockets_url);
        intentsUrl.push(":");
        intentsUrl.push(webSocketsCfg.rain_websockets_port);
        intentsUrl.push(webSocketsCfg.rain_websockets_namespace);
        intentsUrl.push(Messaging.INTENT_SOCKET);
        
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
    Messaging.prototype.sendIntent = function(request) {
        this._validateIntentRequest(request);
    }
    
    /**
     * Method used to validate the requests object.
     */
    Messaging.prototype._validateIntentRequest = function(request) {
        var ex;

        var errorHandler = request.error || function(error) { throw error; };
        
        if(!request.viewContext) {
            ex = new Error("View context not specified.");            
        }
        else if(!request.category) {
            ex = new Error("Intent category not specified.");
        }
        else if(!request.action) {
            ex = new Error("Intent action not specified.");
        }
        
        if(ex) {
            errorHandler(ex);
        }
    }
    
    return {"messaging": new Messaging(RaintimeConfig.raintimeConfig)}
});
