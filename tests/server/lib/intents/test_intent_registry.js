/*
Copyright (c) 2011, Cosnita Radu Viorel <radu.cosnita@gmail.com>
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

libDir = __dirname + "/../../../../lib/";

require.paths.push(libDir);

var modIntentsRegistry      = require("intents/intents_registry")
    , testCase              = require("nodeunit").testCase;

var moduleConfig = {"id": "test-module",
        "version": "1.0"}    
    , intentConfig = {"action": "com.1and1.intents.general.SEND_MAIL",
           "category": "com.1and1.controlpanel.mail",
           "type": "view",
           "provider": "test-view"
    };

var tcRegisterIntent = {};

/**
 * Method used to test the normal flow of _registerIntent method.
 */
tcRegisterIntent.registerIntentNormal = function(test) {   
    intentsRegistry = new modIntentsRegistry.IntentsRegistry();
        
    intentsRegistry._registerIntent(moduleConfig, intentConfig);
    
    // Test for correct registration of the intent.
    var category = intentConfig.category;
    var action = intentConfig.action;
    var intentId = "".concat(moduleConfig.id, "-", moduleConfig.version);
    
    var intentCtx = intentsRegistry._intents[category][action][intentId]; 
    
    test.ok(intentCtx);
    test.equals(intentCtx.type, intentConfig.type);
    test.equals(intentCtx.provider, intentConfig.provider);           
    
    test.done();
}

/**
 * Method used to test registerIntent behavior when an entry already exists.
 */
tcRegisterIntent.registerIntentDuplicate = function(test) {
    intentsRegistry = new modIntentsRegistry.IntentsRegistry();
        
    intentsRegistry._registerIntent(moduleConfig, intentConfig);
    
    try {
        intentsRegistry._registerIntent(moduleConfig, intentConfig);
        
        test.ok(false);
    }   
    catch(err) {
        test.ok(true);
    }
    
    test.done();
}


tcRegisterIntents = {}

/**
 * Method used to test the register intents behavior. It mocks _registerIntent
 * method internally.
 */
tcRegisterIntents.registerIntents = function(test) {
    intentsRegistry = new modIntentsRegistry.IntentsRegistry();
    
    var intentId = "test-module-1.0";
    
    intentsRegistry._registerIntent = function(moduleConfig, intentConfig) {
        var category = intentConfig.category 

        this._intents[category] = {}
        
        var intentCtx = {}
        intentCtx[intentId] = {"type" : intentConfig.type,
                               "provider" : intentConfig.provider}
        
        this._intents[category][intentConfig.action] = intentCtx;
    }
    
    config = {"id": moduleConfig.id,
              "version": moduleConfig.version,
              "intents": [intentConfig]}; 
    
    var category = intentConfig.category;
    var action = intentConfig.action;
    
    intentsRegistry.registerIntents(config);
    
    var intentCtx = intentsRegistry._intents[category][action][intentId]; 
    
    test.ok(intentCtx);
    test.equals(intentCtx.type, intentConfig.type);
    test.equals(intentCtx.provider, intentConfig.provider);           

    test.done();
}

/**
 * Test case for registration of intents when intents section is missing
 * from application descriptor.
 */
tcRegisterIntents.registerIntentsMissing = function(test) {
    intentsRegistry = new modIntentsRegistry.IntentsRegistry();
    
    intentsRegistry.registerIntents(moduleConfig)
    
    console.log(intentsRegistry._intents);
    
    test.equals(JSON.stringify(intentsRegistry._intents), '{}');
    
    test.done();    
}

module.exports.testRegisterIntent = testCase(tcRegisterIntent);
module.exports.testRegisterIntents = testCase(tcRegisterIntents);
