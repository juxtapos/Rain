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
 * @since 25.11.2011
 * @description Module used to do integration testing for auto discovery websockets
 * feature of RAIN. 
 */

"use strict";

var modHelper               = require("../util_loader")
    , modPromise            = require("promised-io/promise")
    , modSockets            = modHelper.loadModule("sockets_container")
    , socketsFactory        = new modSockets.SocketsContainer(modHelper.port)
    , socketsRegistration   = new modSockets.SocketsRegistration(socketsFactory);
    
var modulePath = __dirname + "/../../components/testComponent";

socketsRegistration.registerModuleSocketHandlers(modulePath, "module-test-1.0");

function checkRegistration() {
    var registered = socketsFactory._registeredSockets; 
    
    if(!registered["module-test-1.0/ns2/socket2"]) {
        throw new Error("Registration incorrect: socket2 not registered.");
    }
    
    if(!registered["module-test-1.0/ns1/socket1"]) {
        throw new Error("Registration incorrect: socket1 not registered.");
    }
    
    console.log("Test completed successfully.");
    
    process.exit(0);
}

setTimeout(checkRegistration, 1000);