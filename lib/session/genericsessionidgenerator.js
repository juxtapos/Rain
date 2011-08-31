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

var sessionidgenerator = require("./sessionidgenerator.js"),
	mod_logger        = require('../logger.js'),
	logger            = mod_logger.getLogger('GenericSessionIdGenerator', mod_logger.Logger.SEVERITY.INFO);

/**
 * This is a generic implementation of generic session id generator.
 * It uses unique identifier values for generate key. It does not 
 * scale well in a cluster environment so don't use this implementation
 * in such cases.
 */
function GenericSessionIdGenerator() {
	this._generatedValues = [];
	
	logger.info("Generic session id generator instantiated.");
}

/**
 * Method that simple generates session identifiers in unique identifier
 * format.
 */
function generateKey() {
	var ret;
	
	do {
		ret = Math.random().toString(36); 
	} while(this._generatedValues.indexOf(ret) != -1);
	
	this._generatedValues.push(ret);
	
	return ret; 
}

GenericSessionIdGenerator.prototype = new sessionidgenerator.SessionIdGenerator();
GenericSessionIdGenerator.prototype.constructor = GenericSessionIdGenerator;
GenericSessionIdGenerator.prototype.generateKey = generateKey;

var sessionIdGenerator = new GenericSessionIdGenerator();

exports.sessionIdGenerator = sessionIdGenerator;