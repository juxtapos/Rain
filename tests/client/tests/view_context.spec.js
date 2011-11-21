/*
 Copyright (c) 2011, Alexandru Bularca <alexandru.bularca@1and1.ro>
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

describe("ViewContext tests", function () {
    var Raintime = null;
    var component = null;
    var _raintimeLoaded = false;

    beforeEach(function () {
        require(["core-components/raintime/raintime"], function (obj) {
            Raintime = obj;
            _raintimeLoaded = true;
        });

        waitsFor(function () {
            return _raintimeLoaded;
        }, 'Waiting for Raintime to load');

        runs(function () {
            spyOn(window, 'require').andCallFake(function () {
                arguments[1]({
                    init:function (elementid) {
                        console.log('init toolbar component');
                    }
                });
            });

            component = Raintime.ComponentRegistry.register({
                "renderer_id":207, "domId":1,
                "instanceId":"109946a3e370b2b48802a0802c63739b93b2c2c3",
                "clientcontroller":"/components/cockpit/htdocs/controller/cockpitcontroller.js"
            });

            require.reset();
        });
    });

    afterEach(function () {
        Raintime.ComponentRegistry.deregister(component.id);
        Raintime = null;
        component = null;
        _raintimeLoaded = false;
    });

    it('shoud have Raintime', function () {
        expect(Raintime).not.toBe(null);
    });

    it('should have a component', function () {
        expect(component).not.toBeNull();
    });

    it('should have contain a controller', function () {
        expect(component.controller).toBeDefined();
    });

    it('should have a viewContext', function () {
        var controller = component.controller;
        expect(controller.viewContext).toBeDefined();
    });

    /*it('should have the same instanceId as the component', function () {
        var viewContext = component.controller.viewContext;
        expect(viewContext.instanceId).toBe(component.id);
    });*/
});
