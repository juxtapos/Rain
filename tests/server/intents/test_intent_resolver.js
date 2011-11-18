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

/**
 * @author Radu Viorel Cosnita
 * @version 1.0
 * @since 17.11.2011
 * @description This module is used to provide the test cases for intents resolver class. 
 */

"use strict";

var modHelper       = require("../util_loader")
    , modResolver   = modHelper.loadModule("intents/intents_resolver")
    , exceptions    = modHelper.loadModule("intents/intents_exceptions")     
    , testCase      = require("nodeunit").testCase;

/**
 * Test case used for resolveIntent when multiple handlers are found.
 */
exports.testResolveIntentNHandlers = function(test) {    
    var intentsResolver = new modResolver.IntentsResolver({}, {});
    
    intentsResolver._getIntentProviders = function(category, action, preferences) {
        return [{"intent1" : ""}, {"intent2" : ""}];        
    }
    
    var handlers = intentsResolver.resolveIntent("categ1", "action1", {});
    
    test.equals(handlers.length, 2)
    test.equals(handlers[0].intent1, "");
    test.equals(handlers[1].intent2, "");
    
    test.done();
}

/**
 * Test case used for resolvedIntent when one handler is found.
 */
exports.testResolveIntentHandler = function(test) {
    var intentsResolver = new modResolver.IntentsResolver({}, {});
    
    intentsResolver._getIntentProviders = function(category, action, preferences) {
        return [{"intent1" : ""}];        
    }
    
    intentsResolver._renderIntent = function(intent) {
        return "Good boy"; 
    }
    
    var result = intentsResolver.resolveIntent("categ1", "test1", {});
    
    test.equals(result, "Good boy");
    
    test.done();
}

/**
 * Test case used for resolveIntent when no handler is found.
 */
exports.testResolveIntentMissing = function(test) {
    var intentsResolver = new modResolver.IntentsResolver({}, {});
    
    intentsResolver._getIntentProviders = function(category, action, preferences) {
        return [];        
    }
    
    var result = intentsResolver.resolveIntent("", "", {});
    
    test.equals(result.length, 0);
    
    test.done();
}

var tcGetPreferredHandler = {};

tcGetPreferredHandler.intents = {"categ1" : {"action1": {"intent1": {"type": "view",
                                                       "provider": "view1"},
                                             "intent2": {"type": "view",
                                                       "provider": "view2"}}}};
                                                       
tcGetPreferredHandler.intentsRegistry = {"intents": tcGetPreferredHandler.intents};

/**
 * Test case for getPreferredHandler method - normal flow.
 */
tcGetPreferredHandler.testGetPreferredHandler = function(test) {
    var intentsRegistry =tcGetPreferredHandler.intentsRegistry;
    
    var preferences = {"categ1": {"action1": "intent1"}};
    
    var intentsResolver = new modResolver.IntentsResolver({}, intentsRegistry);
    
    var intent = intentsResolver._getPreferredHandler("categ1", "action1", preferences);
    
    test.equals(intent.type, "view");
    test.equals(intent.provider, "view1");
    
    test.done();
}

/**
 * Test case for getPreferredHandler method - missing preferences, missing category,
 * missing action.
 */
tcGetPreferredHandler.testGetPreferredHandlerMissing = function(test) {
    var intentsRegistry =tcGetPreferredHandler.intentsRegistry;
    var intentsResolver = new modResolver.IntentsResolver({}, intentsRegistry);
    
    var preferences = {"categ1": {"action1": "intent3"}};

    /**
     * Intent category missing from preferences.
     */
    var intent = intentsResolver._getPreferredHandler("categ2", "action1", preferences);    
    
    test.ok(!intent);
    
    /**
     * Intent action missing from preferences.
     */
    intent = intentsResolver._getPreferredHandler("categ1", "action2", preferences);
    
    /**
     * Intent set in preferences but missing from registry.
     */   
    intent = intentsResolver._getPreferredHandler("categ1", "action1", preferences);
    
    test.ok(!intent);
    
    test.done();
}

exports.tcGetPreferredHandler = testCase(tcGetPreferredHandler);

var tcGetIntentProviders = {};

tcGetIntentProviders.intents = {"categ1" : {"action1": {"intent1": {"type": "view",
                                                       "provider": "view1"},
                                                  "intent2": {"type": "view",
                                                              "provider": "view2"}}}};
                                                       
tcGetIntentProviders.intentsRegistry = {"intents": tcGetPreferredHandler.intents};

/**
 * Method used to test get intent providers algorithm for multiple handlers.
 */
tcGetIntentProviders.testGetIntentProviders = function(test) {
    var intentsRegistry = tcGetIntentProviders.intentsRegistry;
    
    var intentsResolver = new modResolver.IntentsResolver({}, intentsRegistry);
    
    var handlers = intentsResolver._getIntentProviders("categ1", "action1");
    
    test.equals(handlers.length, 2)
    
    test.done();
}

exports.tcGetIntentProviders = testCase(tcGetIntentProviders);