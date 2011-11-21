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
 * @since 17.11.2011
 * @description Module used to provide the integration test required for socket factory. 
 * This example shows how to write handlers that can be automatically registered to a socket factory.
 */

"use strict";

var modHelper           = require("./util_loader")
    , modPromise        = require("promised-io/promise")
    , modSockets        = modHelper.loadModule("sockets_container")
    , socketFactory     = new modSockets.SocketsContainer(1337)
    , modSocketClient   = modHelper.loadModule("socket.io-client");

/**
 * Class used to show a socket handler can be written easily.
 */
function TestHandler(promise) { 
    this._promise = promise;    
}
    
TestHandler.prototype.getSocketName = function() {
    promise.resolve({});
    
    return "/chat";
}

TestHandler.prototype.handle = function(socket) {
    console.log("Handle method invoked.");    
    
    socket.emit("hello", {
        "message" : "Good bye lady"
    });
    
    socket.on("bye", function(data) {
        console.log("Bye event.");
        
        process.exit(0);
    });
}

var promise = new modPromise.defer();

socketFactory.addSocketHandler(new TestHandler(promise));

promise.promise.then(function(data) {
   function simulateClient() {
       var client = modSocketClient.connect("http://localhost:1337/chat");
       
       client.on("hello", function(data) {
           console.log(data.message);
           
           client.emit("bye", {});
       });
   }
   
   setTimeout(simulateClient, 1000);
});