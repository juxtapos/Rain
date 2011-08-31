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

var 	mod_logger        = require('logger'),
		logger            = mod_logger.getLogger('Session', mod_logger.Logger.SEVERITY.INFO);
/**
 * This is the api for a session implementation. Each session needs
 * a way to provide unique identifiers for sessions and also to have
 * a mechanism to storage session information.
 * 
 * @param sessionIdGenerator
 * @param sessionStorage
 */
function Session(sessionIdGenerator, sessionStorage) {
	this.sessionIdGenerator = sessionIdGenerator;
	this.sessionStorage = sessionStorage;
}

/**
 * Method used to set a value within the session.
 * 
 * @param sessionId
 * @param key
 * @param value
 */
function setValue(sessionId, key, value) {
	this.sessionStorage.setValue(sessionId, key, value);
}

/**
 * Method used to extract an attribute (key) from the specified
 * session.
 * 
 * @param sessionId
 * @param key
 * @returns An object.
 */
function getValue(sessionId, key) {
	return this.sessionStorage.getValue(sessionId, key);
}

/**
 * Method used to determine if a session exists or  not.
 * 
 * @param sessionId
 * @param key
 */
function containsKey(sessionId, key) {
	return this.sessionStorage.getValue(sessionId, key) != null;
}

/**
 * Method used to create a session.
 * 
 * @param sessionId If this is set the current session will be flushed.
 * 
 * @returns newly created session
 */
function create(sessionId) {	
	if(!sessionId || !this.sessionStorage.isValidSession(sessionId)) {
		sessionId = this.sessionIdGenerator.generateKey();
		this.sessionStorage.create(sessionId, true);
	}
		
	return sessionId;
}

/**
 * Method used to destroy the current session.
 */
function destroy(sessionId) {
	// TODO this is stupid. We will refactor this so it completely removes the session
	// from storage.
	this.sessionStorage.create(sessionId, true);
}

Session.prototype.setValue = setValue;
Session.prototype.getValue = getValue;
Session.prototype.containsKey = containsKey;
Session.prototype.create = create;
Session.prototype.destroy = destroy;

exports.Session = Session;