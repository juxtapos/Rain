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
 * @description This module provides the unit tests for sockets container.
 */

"use strict";

var modHelper               = require("../util_loader")
    , modSocketsContainer   = modHelper.loadModule("sockets_container")   
    , SocketsContainer      = modSocketsContainer.SocketsContainer;

/**
 * Method used to obtain a mocked container: socket io dependencies are completely mocked.
 */
function getMockedContainer() {
    var modSockets = new Object();
    modSockets.listen = function(port) { return modSockets; }    
    
    SocketsContainer.prototype._configureSocketIO = function(socketIO) { };
    
    return {"factory": new SocketsContainer(1338, modSockets),
            "socketIo": modSockets};
}
    
/**
 * Method used to test getSession method normal flow - session obtained from global scope.
 */    
exports.testGetSession = function(test) {
    /**
     * Here we mock all functions required for testing SocketsContainer.
     */
    var intentContext = {"session": "1234"};
    
    Server.session = new Object();
    Server.session.get = function(sessionId, callback) {
        callback(null, {"username": "rcosnita"});
    };
       
    var factory = getMockedContainer().factory;
    
    /**
     * Tests assertion.
     */
    var session = factory._getSession(intentContext);    
    
    session.then(function(data) {
        test.equals(data.session.username, "rcosnita");
        
        test.done();               
    });    
}

/**
 * Method used to test the normal flow of add socket handler process. 
 */
exports.testAddSocketHandler = function(test) {
    /**
     * Section for mocking all dependencies.
     */
    var socketObject = new Object();
    socketObject.getSocketName = function() {
        return "test socket";
    }
    
    socketObject.handle = function() { }
    
    var namespace = "/ns/1/test";
    
    var mockedFactory = getMockedContainer();
    
    var modSockets = mockedFactory.socketIo;
    
    modSockets.of = function(name) {
        var channel = new Object();
        var socket = new Object();
        
        channel.on = function(eventName, handle) {
            handle(socket);
        }
        
        return channel;
    }
        
    /**
     * Assertions section.
     */
    var factory = mockedFactory.factory;
    
    factory.addSocketHandler(socketObject, namespace);
    
    test.ok(socketObject.getSession)
    test.equals(socketObject, factory._registeredSockets[namespace + "/test socket"]);
    
    test.done();
}

/**
 * Method used to test the addSocketHandler method when an invalid request is made.
 */
exports.testAddSocketHandlerInvalid = function(test) {
    var mockedFactory = getMockedContainer();
    
    var factory = mockedFactory.factory;
    
    /**
     * socket object is undefined.
     */
    try {
        factory.addSocketHandler();
        
        test.ok(false);
    }
    catch(err) {
        test.ok(true);
    }

    /**
     * socket object is null.
     */    
    try {
        factory.addSocketHandler(null);
        
        test.ok(false);
    }
    catch(err) {
        test.ok(true);
    }
    
    /**
     * socket object is incomplete => getSocketName is undefined.
     */
    try {
        factory.addSocketHandler(new Object());
        
        test.ok(false);
    }
    catch(err) {        
        test.ok(true);
    }
    
    
    /**
     * socket object is incomplete => handle is undefined.
     */    
    try {
        var socketObject = new Object();
        socketObject.getSocketName = function() { return "test socket"; }
        
        factory.addSocketHandler(socketObject);
        
        test.ok(false);
    }
    catch(err) {
        test.ok(true);
    }    
    
    test.done();    
}

/**
 * Method used to test add socket handler when socket already exists. The only
 * possible case for this is when getSocketName in two different socket handlers
 * within the same namespace returns the same value.
 */
exports.testAddSocketHandler = function(test) {
    /**
     * Section for mocking all dependencies.
     */
    var socketObject = new Object();
    socketObject.getSocketName = function() {
        return "test socket";
    }
    
    socketObject.handle = function() { }
    
    var mockedFactory = getMockedContainer();
    
    var modSockets = mockedFactory.socketIo;
    
    modSockets.of = function(name) {
        var channel = new Object();
        var socket = new Object();
        
        channel.on = function(eventName, handle) {
            handle(socket);
        }
        
        return channel;
    }
        
    /**
     * Assertions section.
     */
    var factory = mockedFactory.factory;
    
    try {
        factory.addSocketHandler(socketObject);
        factory.addSocketHandler(socketObject);
    }
    catch(err) {
        if(err instanceof modSocketsContainer.SocketHandlerAlreadyExist) {
            test.ok(true);
        }
        else {
            test.ok(false);
        }
    }
    
    test.done();    
}
