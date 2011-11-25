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
 * @description Module used to provide a simple controller for showcasing how to use intents and auto discovered sockets.. 
 */
define(function(SocketIO) {
    function init() {
        this._socket = this.viewContext.getWebSocket("chat/dummy socket");
        this._socket = this.clientRuntime.messaging._getWebSocket("chat-1.0", "chat/dummy socket");
                
        this.configureSocketDummy();
        this.start();
    }
    
    function start() {
        var messaging = this.clientRuntime.messaging;
        
        var root = this.viewContext.getRoot();
        var btnMissing = root.find("input[data-itemid='btnRequestMissing']");
        var btnExisting = root.find("input[data-itemid='btnRequestExisting']");
        var btnDummyTalk = root.find("input[data-itemid='btnCustomHandler']");
        
        var self = this;
                                               
        btnMissing.click(function() {
            var request = {
                "viewContext": self.viewContext,
                "category": "local_test_intent",
                "action": "local_action",
                "error": function(err) {
                    alert("Intent message: " + err)
                }
            };
            
            messaging.sendIntent(request);            
        });
        
        btnExisting.click(function() {
            var request = {
                "viewContext": self.viewContext,
                "category": "com.rain.test.general",
                "action": "com.rain.test.general.SHOW_CHAT",
                "success": function(data) {
                    alert(JSON.stringify(data));
                },
                "error": function(err) {
                    alert("Intent message: " + err)
                }
            };
            
            messaging.sendIntent(request);
        });        
        
        btnDummyTalk.click(function() {
            self._socket.emit("hello", {"ignored": true});
        });
    }
    
    /**
     * Method used to communicate with the dummy server side handler.
     */
    function configureSocketDummy() {
        this._socket.on("bye", function(data) {
            alert(JSON.stringify(data));
        });
    }
    
    return {init: init,
            start: start,
            configureSocketDummy: configureSocketDummy}
});
