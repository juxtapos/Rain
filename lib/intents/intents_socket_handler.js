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

"use strict";

/**
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 22.11.2011
 * @description This module provides the socket handler for all intents requests.
 */

var modPath     = require("path")
    , logger    = require("../logger").getLogger(modPath.basename(module.filename));

exports.SocketIntentsHandler = SocketIntentsHandler;

/**
 * Class used to implement the protocol for requesting intents using web socket. Below
 * you can find all protocol accepted commands:
 * 
 * Client:
 *     - request_intent 
           -- Message sent to request an intent.
           -- Sent information: intentCategory, intentAction, intentContext, currentSession
 *     - intent_loaded
 *         -- Message received to signal the intent response was received from server.
 *         -- Received information: view_markup or exception
 * 
 * Server:
 *     - request_intent
 *          -- On this message the server launches the intent resolve process. After the process 
 *            is completed, an intent_loaded or intent_exception message is emitted.
 *     - intent_loaded
 *          -- Sent information: 
 *                  -- view_markup: if no exception was thrown while processing the intent
 *     - intent_exception
 *          -- Message emitted when an exception has ocourred.
 *          -- Sent information:
 *                  -- exception text in format: {"message": msg}.
 *     - intent_multiple_handlers
 *          -- Message emitted when more than one handler is available.
 *          -- Sent information:
 *                  -- a list of intent minimized descriptors: intent_module + intent_description
 */
function SocketIntentsHandler(intentsResolver) {
    this._intentsResolver = intentsResolver;
};


SocketIntentsHandler.prototype.getSocketName = function() {
    return "/rain_sockets/rain_core/intents";
};

SocketIntentsHandler._INTENT_MULTIPLE_HANDLER   = "intent_multiple_handlers";
SocketIntentsHandler._INTENT_EXCEPTION          = "intent_exception";
SocketIntentsHandler._INTENT_LOADED             = "intent_loaded";
SocketIntentsHandler._INTENT_REQUEST            = "request_intent";

/**
 * Method used to implement the server section of the protocol.
 */
SocketIntentsHandler.prototype.handle = function(socket) {
    this._requestIntent(socket);
};

/**
 * Method used to handle a request_intent message.
 */
SocketIntentsHandler.prototype._requestIntent = function(socket) {
    var self = this;
    
    socket.on(SocketsIntentsHandler._INTENT_REQUEST, function(data) {
        if(!data.intentCategory) {
            self._sendException(socket, "You must specify intent category.")
        }
        
        if(!data.intentAction) {
            self._sendException(socket, "You must specify intent action.")            
        }
        
        if(!data.intentContext) {
            self._sendException(socket, "You must specify intent context.")
        }
        
        if(!data.currentSession) {
            self._sendException(socket, "You must specify intent current session.");
        }
        
        var response = self._intentsResolver.resolveIntent();
        
        if(response.length == 0) {
            self._sendException(socket, "No intent handler found");
        }
        else if(response.then) {
            /**
             * Response is a promise => view already processed.
             */
            response.then(function(data) {
                self._sendIntentLoaded(socket, data);
            });            
        }
        else {
            self._sendMultipleHandlers(socket, response);
        }
    });
};

/**
 * Method used to send an exception through the socket.
 * 
 * @param {SocketIO.Manager} socket: A socket reference.
 * @param {String} exception: An error message that occurred.
 */
SocketIntentsHandler.prototype._sendException = function(socket, errMessage) {
    socket.emit(SocketIntentsHandler._INTENT_EXCEPTION, {"message" : errMessage});
};

/**
 * Method used to send a list of handlers that can handle the request. 
 */
SocketIntentsHandler.prototype._sendMultipleHandlers = function(socket, handlers) {
    var ret = {};
    
    handlers.forEach(function(item) {
        console.log(handlers);
    });
    
    socket.emit(SocketIntentsHandler._INTENT_MULTIPLE_HANDLER, ret);
};

/**
 * Method used to send the intent loaded event through the socket.
 */
SocketIntentsHandler.prototype._sendIntentLoaded = function(socket, data) {
    socket.emit(SocketIntentsHandler._INTENT_LOADED, data);
};
