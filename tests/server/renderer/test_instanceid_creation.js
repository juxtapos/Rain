/*
Copyright (c) 2011, Mitko Tschimev <mitko.tschimev@1und1.de>
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




var testsHelper             = require("../util_loader")
    , modCache              = testsHelper.loadModule('./cache.js')
    , modResourcemanager    = testsHelper.loadModule('./resourcemanager.js')
    , modComponent          = testsHelper.loadModule("componentcontainer")
    , modRenderer           = testsHelper.loadModule("renderer").Renderer
    , testCase              = testsHelper.loadModule("nodeunit").testCase;

var moduleConfig = {"id": "test-module", "version": "1.0"};

modCache.configure(Server.conf.server);
var ressourceManager    = modResourcemanager(Server.conf, modCache)
  , componentcontainer  = new modComponent.ComponentContainer(ressourceManager);

var tcInstanceId = {};

/**
 * Method used to test the normal flow of _registerIntent method.
 */
tcInstanceId.createInstanceIdwithoutStaticId = function(test) {   
    var componentid = componentcontainer.getComponentByRequestPath("/tests/components/testComponent")
       ,component = componentcontainer.createComponent(componentid)
       ,req       = { session : {}, sessionID : "a session id....." }
       ,res       = {};
    
    var renderer = new modRenderer({
        component : component
       ,url       : "/tests/components/testComponent/htdocs/main.html"
       ,data      : { req_lang : 'en_US'}
       ,req       : req
       ,res       : res
    });
    
    var instanceMap = renderer.getInstanceIdMap();
    
    test.equals(instanceMap.domId, 1);
    test.ok(instanceMap.instanceId);
    
    test.done();
};

tcInstanceId.createInstanceIdwithStaticId = function(test) {   
    var componentid = componentcontainer.getComponentByRequestPath("/tests/components/testComponent")
       ,component = componentcontainer.createComponent(componentid)
       ,req       = { session : {}, sessionID : "a session id....." }
       ,res       = {};
    
    var renderer = new modRenderer({
        component : component
       ,url       : "/tests/components/testComponent/htdocs/main.html"
       ,data      : { req_lang : 'en_US'}
       ,req       : req
       ,res       : res
    });
    
    //static_id
    var static_id = "whatever";
    
    var instanceMap = renderer.getInstanceIdMap(static_id);
    
    test.equals(instanceMap.domId, 1);
    test.ok(instanceMap.instanceId);
    
    test.done();
};

tcInstanceId.createInstanceIdAndHoldInSession = function(test) {   
    var componentid = componentcontainer.getComponentByRequestPath("/tests/components/testComponent")
       ,component = componentcontainer.createComponent(componentid)
       ,req       = { session : {}, sessionID : "a session id....." }
       ,res       = {};
    
    var renderer1 = new modRenderer({
        component : component
       ,url       : "/tests/components/testComponent/htdocs/main.html"
       ,data      : { req_lang : 'en_US'}
       ,req       : req
       ,res       : res
    });
    
    var renderer2 = new modRenderer({
        component : component
       ,url       : "/tests/components/testComponent/htdocs/main.html"
       ,data      : { req_lang : 'en_US'}
       ,req       : req
       ,res       : res
    });
    
    //static_id
    var static_id = "whatever";
    
    
    var instanceMap1 = renderer1.getInstanceIdMap()
       ,instanceMap2 = renderer2.getInstanceIdMap(static_id);
    
    test.equals(instanceMap1.domId, 1);
    test.equals(instanceMap2.domId, 2);
    
    var count = 0;
    for(var k in req.session.instanceIds){
        count++;
    }
    test.equal(count, 2);
    
    test.done();
};

tcInstanceId.uniqueInstanceIds = function(test) {   
    var componentid = componentcontainer.getComponentByRequestPath("/tests/components/testComponent")
       ,component = componentcontainer.createComponent(componentid)
       ,req       = { session : {}, sessionID : "a session id....." }
       ,res       = {};
    
    var testCount = 100
       ,uniqueIds = [];
    
    for(var i = 0; i < testCount; i++){
        var renderer = new modRenderer({
            component : component
           ,url       : "/tests/components/testComponent/htdocs/main.html"
           ,data      : { req_lang : 'en_US'}
           ,req       : req
           ,res       : res
        });
                
        var instanceMap = renderer.getInstanceIdMap(i);
        
        var unique = true;
        for(var j = uniqueIds.length; j--;){
            if(uniqueIds[j] == instanceMap.instanceId){
                unique = false;
            }
        }
        test.ok(unique);
        
        uniqueIds.push(instanceMap.instanceId);
    }
    
    test.done();
};


module.exports.testInstanceId = testCase(tcInstanceId);