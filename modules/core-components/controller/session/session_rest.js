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

var mod_logger        = require('logger.js'),
	mod_url			  = require("url"),
	logger            = mod_logger.getLogger('SessionRest', mod_logger.Logger.SEVERITY.INFO),
	mod_session		  = require("session/genericsession");


/**
 * This request is used for creating a new session.
 * 
 * @param request
 * @param response
 */
function createSession(request, response) {
	logger.info("Generate a new session id.");
	
	var query = mod_url.parse(request.url, true).query;
	
	var sessionId = query.sessionId;	
	
	logger.info("Received session id: " + sessionId);
	
	try {		
		sessionId = mod_session.session.create(sessionId);
		
		var ret = JSON.stringify({"sessionId" : sessionId});
		
		logger.info("session id json: " + ret);
		
		response.write(ret);
		response.end();
	}
	catch(ex) {
		logger.error(ex);
		
		response.writeHead(404, {"Content-Type" : "text/plain"});
		response.write("" + ex);
		response.end();				
	}
}

/**
 * This method is used to set a value in the current session id.
 * 
 * @param request
 * @param response
 */
function setValue(request, response) {
	var sessionId = request.body.sessionId;
	var key = request.body.key;
	var value = request.body.value;
	
	logger.info("Adding key " + key + " to session " + sessionId);
	
	try {
		mod_session.session.setValue(sessionId, key, value);
		
		response.end();
	}
	catch(ex) {
		response.writeHead(404, {"Content-Type" : "text/plain"});
		response.write("" + ex);
		response.end();		
	}
}

/**
 * Method used to obtain a value from a session.
 * 
 * @param request
 * @param response
 */
function getValue(request, response) {
	var query = mod_url.parse(request.url, true).query;
	
	var sessionId = query.sessionId;
	var key = query.key;
	
	logger.info("Obtaining key " + key + " from session " + sessionId);
	
	try {
		var ret = mod_session.session.getValue(sessionId, key);
		
		response.end(ret);
	}
	catch(ex) {
		response.writeHead(404, {"Content-Type" : "text/plain"});
		response.write("" + ex);
		response.end();
	}
}

exports.get = getValue;
exports.put = createSession;
exports.post = setValue;