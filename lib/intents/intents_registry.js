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
 * @since 14.11.2011
 * @description This module is used to provide a mechanism for intents registry.
 */

"use strict";

var modPath     = require('path')
    , logger    = require("../logger").getLogger(modPath.basename(module.filename));    

exports.IntentsRegistry = IntentsRegistry;

function IntentsRegistry() {
    this._intents = {};
}

/**
 * @description Method used to register all the intents starting from a config object.
 * @param {Dictionary} config This is the module descriptor dictionary as read from json file.
 */
IntentsRegistry.prototype.registerIntents = function(config) {
    if(!config.intents) {
        var msg = "No intents defined for module " + config.id;

        logger.info(msg);
        
        return;
    }
       
    var self = this;       
        
    config.intents.forEach(function(intentConfig) {
       self._registerIntent(config, intentConfig);
    });
    
    logger.info(JSON.stringify(config.intents) + " intents registered.");
}

/**
 * @description Method used to register a single intent object. A module can not provide two implementations for the same intent.
 * @param {Dictionary} moduleConfig This is the complete descriptor of the module.
 * @param {Dictionary} intentConfig This is the intent descriptor we want to register.
 */
IntentsRegistry.prototype._registerIntent = function(moduleConfig, intentConfig) {
    logger.debug("Registering intent " + JSON.stringify(intentConfig));
    
    var category = intentConfig.category;
    
    var categoryMap = {};
    
    if(!this._intents[category]) {
        this._intents[category] = categoryMap;
    } else {
        categoryMap = this.intents[category];  
    }
    
    var action = intentConfig.action
    
    var actionMap = {}
    
    if(!categoryMap[action]) {
        categoryMap[action] = actionMap;
    }
    else {
        actionMap = categoryMap[action];
    }
    
    var intentId = "".concat(moduleConfig.id, "-", moduleConfig.version);
    
    if(actionMap[intentId]) {
        var msg = [];
        
        msg.push("Intent");
        msg.push(intentId);
        msg.push("is already registered.");
        
        throw new Exception(" ".join(msg));
    }
    
    actionMap[intentId] = {"type": intentConfig.type,
        "provider": intentConfig.provider}       
}