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

/**
 * This is the API for session storage objects. This allows you to define
 * different storage implementations that can be plugged into session object.
 */

"use strict";

function SessionStorage() {
}

/**
 * This method must be overriden by storage implementation
 * to persist values. 
 * 
 * @param sessionId A session identifier.
 * @param key The attribute we want to set within the session.
 * @param value The value we want to asssing to key.
 */
function setValue(sessionId, key, value) {}

/**
 * This method must be overriden by storage to obtain values. 
 * 
 * @param sessionId A session identifier
 * @param key A key that we want to extract from session.
 */
function getValue(sessionId, key) { }

/**
 * This method create a new session within the storage. If the clear
 * flag is switched on and the session already exist it will clear 
 * the current session.
 */
function create(sessionId, clear) { }

/**
 * Method used to determine if a session id is valid or not.
 */
function isValidSession(sessionId) {
	
}

SessionStorage.prototype.setValue = setValue;
SessionStorage.prototype.getValue = getValue;
SessionStorage.prototype.create = create;
SessionStorage.prototype.isValidSession = isValidSession;

exports.SessionStorage = SessionStorage;