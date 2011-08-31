/*
Copyright (c) 2011, Radu Viorel Cosnita <radu.cosnita@gmail.com>

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

var sessionstorage = require("./sessionstorage.js"),
	mod_logger        = require('../logger.js'),
	logger            = mod_logger.getLogger('MapSessionStorage', mod_logger.Logger.SEVERITY.INFO);

/**
 * This is a MAP dummy implementation of session storage. This works
 * reliably in a non clustered environment.
 */
function MapSessionStorage() {
	this._sessions = {};
	
	logger.info("Map session storage instantiated.");
}

/**
 * This method set a value within the specified session. If the session
 * id does not exist it will throw an Error.
 */
function setValue(sessionId, key, value) {
	if(!sessionId) {
		var errMsg = "No session specified";
		
		logger.info(errMsg);
		
		throw new Error(errMsg);
	}
	
	if(!this._sessions[sessionId]) {
		var errMsg = "Unable to find session " + sessionId + ". Session not valid."; 
		
		logger.info(errMsg);
		
		throw new Error(errMsg);
	}
	
	this._sessions[sessionId][key] = value;
}

/**
 * This method obtain a key from the specified session.
 * 
 * @param sessionId
 * @param key
 */
function getValue(sessionId, key) {
	if(!sessionId) {
		var errMsg = "No session specified";
		
		logger.info(errMsg);
		
		throw new Error(errMsg);
	}	
	
	if(!this._sessions[sessionId]) {
		var errMsg = "Unable to find session " + sessionId + ". Session not valid."; 
		
		logger.info(errMsg);
		
		throw new Error(errMsg);
	}	
	
	return this._sessions[sessionId][key];
}



/**
 * Method used to create a new session. If clear flag is false and session exists nothing
 * happen. (idempotency effect).
 * 
 * @param sessionId session identifier we want to create.
 * @param clear A boolean value telling if we want to reset the session or not if it
 * 			already exist.
 */
function create(sessionId, clear) {
	if(!clear && this.isValidSession(sessionId)) {
		return;
	}
		
	if(clear || !this._sessions[sessionId]) {
		this._sessions[sessionId] = {};
	}
		
	return;	
}

/**
 * Method used to determine if session id is valid or not.
 * 
 * @param sessionId
 * @returns
 */
function isValidSession(sessionId) {
	return this._sessions[sessionId] ? true : false;
}

MapSessionStorage.prototype = new sessionstorage.SessionStorage();
MapSessionStorage.prototype.constructor = MapSessionStorage;
MapSessionStorage.prototype.setValue = setValue;
MapSessionStorage.prototype.getValue = getValue;
MapSessionStorage.prototype.create = create;
MapSessionStorage.prototype.isValidSession = isValidSession;

var mapSessionStorage = new MapSessionStorage();

exports.sessionStorage = mapSessionStorage;