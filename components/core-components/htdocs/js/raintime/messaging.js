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
define(["core-components/raintime/raintime_config",
        "core-components/raintime/messaging_intents",
        "core-components/raintime/messaging_observer",
        "core-components/socket.io/socket.io"], function(RaintimeConfig, Intents, Observer, SocketIO) {
    /**
     * Class used to build the messaging layer.
     */
    function Messaging(config) {
        this._config = config;
        
        _addWebSocketsBaseUrl();
        
        this._intents = new Intents.intents(config);
        
        var self = this;
        
        var sendIntent = this._intents.sendIntent;
        
        this.sendIntent = function(request) {
            sendIntent.apply(self._intents, [request]);
        };
        this.publish = Observer.publish;
        this.subscribe = Observer.subscribe;
        this.unsubscribe = Observer.unsubscribe;
    }
    
    /**
     * Method used to obtain a websocket for a specified module and a relative url.
     * 
     * @param {String} moduleId: This is the module identifier.
     * @param {String} url: This is the relative url of the web socket.
     * 
     * @example
     * Imagine you have a web sockets structure like: 
     * comp
     *    websockets
     *      chat
     *          dummy_handler
     * 
     * Let's assume module is named chat and it has version 1.0.
     * 
     * This mean the socket can be accessed at: http://[configured base url]/chat-1.0/chat/[handler name]
     */
    Messaging.prototype._getWebSocket = function(moduleId, url) {
        if(url.charAt(0) != "/") {
            url = "/" + url;
        }
        
        var socketUrl = RaintimeConfig.raintimeConfig.rain_websockets.baseUrl + "/" + moduleId + url;
        
        return SocketIO.io.connect(socketUrl);
    }
    
    /**
     * Method used to add the base url for websockets.
     */
    function _addWebSocketsBaseUrl() {
        var config = RaintimeConfig.raintimeConfig.rain_websockets;
               
        config.baseUrl = config.rain_websockets_url + ":" + config.rain_websockets_port;  
    }
    
    var messaging = new Messaging(RaintimeConfig.raintimeConfig);
    
    return {"messaging": messaging}
});
