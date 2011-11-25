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
 * @since 21.11.2011
 * @description This module provides the socket container for all web sockets
 * that will be opened on a rain server.
 */

var modFs         = require("fs")
    , modPath         = require("path")
    , logger        = require("./logger").getLogger(modPath.basename(module.filename))
    , modPromise    = require("promised-io/promise")
    , socketIo      = require("socket.io")
    , sys           = require("sys");

exports.SocketsContainer = SocketsFactory;
exports.SocketsHandler = new SocketHandler();
exports.SocketHandlerAlreadyExist = SocketHandlerAlreadyExist;
exports.SocketsRegistration = SocketsRegistration;

/**
 * Class used to hold references of all registered sockets
 * 
 * @param {Integer} socketsPort: A numeric value for sockets port.
 * @param {socketIo} modSockets: Optional parameters used only in unit tests. Do not
 * manually use this parameter.
 */
function SocketsFactory(socketsPort, modSockets) {
    this._registeredSockets = {};
    
    if(!socketsPort) {
        socketsPort = Server.conf.server.socketsPort;        
    }
    
    this._socketsPort = socketsPort;
    
    logger.debug("RAIN Sockets port is: " + this._socketsPort);
    
    if(modSockets) {
        socketIo = modSockets;
    }
            
    socketIo = socketIo.listen(this._socketsPort);
    this._configureSocketIO(socketIo);
        
    logger.info("Sockets factory instantiated.");
}

/**
 * Method used to configure socket io.
 */
SocketsFactory.prototype._configureSocketIO = function(socketIo) {
    socketIo.configure(function() {
        socketIo.enable("browser client tag");
        socketIo.set("transports", [
            'websocket'
          , 'flashsocket'
          , 'htmlfile'
          , 'xhr-polling'
          , 'jsonp-polling'
        ]);
    });    
}

/**
 * Method used to obtain the current session for an object.
 * @param {Dictionary} intentContext: this is the intent context received from client.
 * 
 * @example:
 * getSession(intentContext).then(function(data) {
 *    // do something with the session. 
 * });
 */
SocketsFactory.prototype._getSession = function(intentContext) {
    var sessionPromise = new modPromise.defer();
    
    var sessionId = intentContext.session;
    
    Server.session.get(sessionId, function(arg, sess) {
        sessionPromise.resolve({"session": sess});
    });
    
    return sessionPromise.promise;
}

/**
 * Method used to a new socket handler to this factory. If the socketName already exists
 * the method will throw an exception.
 * 
 * @param {SocketHandler} socketObject: Socket object we want to bind.
 * @param {String} namespace: Socket namespace.
 */
SocketsFactory.prototype.addSocketHandler = function(socketObject, namespace) {
    if(!socketObject) {
        throw new Error("Socket object must be specified.");
    }
     
    if(!socketObject.getSocketName) {
        throw new Error("Socket object must contain method getSocketName");
    }
    
    if(!socketObject.handle) {
        throw new Error("Socket object must contain method handle.");
    }
        
    var socketName = socketObject.getSocketName();
    
    if(!socketName || socketName.length == 0) {
        throw new Error("Socket name must not be empty.");
    }
    
    if(socketName.charAt(0) != "/") {
        socketName = "/" + socketName;
    }
    
    if(namespace) {
        if(namespace.charAt(namespace.length - 1) == '/') {
            namespace = namespace.substring(0, namespace.length - 1);
        }
        
        socketName = namespace + socketName;
    }
       
    logger.debug("Adding a new socket partition " + socketName);    
        
    if(this._registeredSockets[socketName]) {
        throw new SocketHandlerAlreadyExist("Socket " + socketName + " is already binded.");
    }
    
    socketObject.getSession = this._getSession; 
     
    this._registeredSockets[socketName] = socketObject;
    
    var self = socketObject;
    
    /**
     * We do this to save this pointer inside the handler.
     */
    var handle = function(socket) {
        socketObject.handle.apply(self, [socket]);
    }
    
    socketIo.of(socketName).on("connection", handle);
};

/**exports.
 * This is the typical handler object that must be inherited by each custom socket 
 * handler we implement.
 */
function SocketHandler() {
    /**
     * This method provide the socket name we want to register.
     * 
     * @return The socket name.
     */
    function getSocketName() {}
    
    /**
     * This method is binded to connection event of the main socket. Here you can implement
     * the business logic of the socket.
     */
    function handle(socket) {}
}

/**
 * Custom exception used to mark an existing socket handler.
 */
function SocketHandlerAlreadyExist(msg) {
    this.message = msg;
}


/**
 * This is the class responsible for registering sockets.
 * 
 * @param {SocketsFactory} socketsFactory: The sockets container where we register handlers.
 */
function SocketsRegistration(socketsFactory) {
    this._socketsFactory = socketsFactory;
    
    logger.debug("Sockets registration instantiated."); 
}

SocketsRegistration._WEBSOCKETS_HOLDER = "websockets";

/**
 * Method used to register all sockets handlers belonging to a module.
 * 
 * @param {String} modulePath: The absolute path to the module.
 * @param {String} namespaceBase: This is the basic name space for the module. It should be compose from [moduleName]-[moduleVersion]
 */
SocketsRegistration.prototype.registerModuleSocketHandlers = function(modulePath, namespaceBase) {
    logger.debug("Registering all websockets handlers for module " + modulePath);
    
    var websocketsPath = modulePath + "/" + SocketsRegistration._WEBSOCKETS_HOLDER;
    
    var self = this;
      
    var socketsDir;

    var namespaces = {}

    try {
        var visitDirs = [websocketsPath];
                                        
        do {
            var path = visitDirs[0];
                   
            var files = modFs.readdirSync(path);            
                        
            files.forEach(function(file) {                            
                var handlerPath = path + "/" + file;
                               
                if(modFs.statSync(handlerPath).isDirectory()) {                    
                    visitDirs.push(handlerPath);
                                          
                    if(!namespaces[handlerPath]) {
                        namespaces[handlerPath] = namespaceBase + handlerPath.replace(websocketsPath, "");
                    }                    
                }
                else {                    
                    self._registerSocketHandler(handlerPath, namespaces[path]);
                }
            });
            
            visitDirs.splice(0, 1);
        }
        while(visitDirs.length > 0);
    }
    catch(err) {
        logger.debug("No websockets handlers found for module " + modulePath);        
    }
}

/**
 * Method used to register a web socket handler. This will ease a lot
 * the way sockets are managed and accessed. 
 * 
 * @param {String} handlerPath: This is the absolute path of the handler.
 */
SocketsRegistration.prototype._registerSocketHandler = function(handlerPath, namespace) {
    var modHandler = require(handlerPath);
    
    var handler = new modHandler();
    
    this._socketsFactory.addSocketHandler(handler, namespace);
}

sys.inherits(SocketHandlerAlreadyExist, Error);