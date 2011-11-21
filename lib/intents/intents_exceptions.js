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
 * @description Module used to provide custom exception that can occur when working
 * with errors. 
 */

var sys     = require("sys");

/**
 * Exception thrown when an intent category is missing.
 */
function IntentCategoryNotFound(message) {
    this.message = message;
}

sys.inherits(IntentCategoryNotFound, Error);

/**
 * Exception thrown when an intent action is missing.
 */
function IntentActionNotFound(message) {
    this.message = message;
}

/**
 * Exception thrown when an intent provider is missing.
 */
function IntentProviderNotFound(message) {
    this.message = message;
}

sys.inherits(IntentActionNotFound, Error);
sys.inherits(IntentCategoryNotFound, Error);
sys.inherits(IntentProviderNotFound, Error);

exports.IntentCategoryNotFound = IntentCategoryNotFound;
exports.IntentActionNotFound = IntentActionNotFound;
exports.IntentProviderNotFound = IntentProviderNotFound;