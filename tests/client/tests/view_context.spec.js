describe("raintime behaviour", function () {
    var component = null;

    it('should have a component', function () {
        spyOn(window, 'require').andCallFake(function () {
            arguments[1]({
                init:function (elementid) {
                    console.log('init toolbar component');
                }
            });
        });

        component = Raintime.ComponentRegistry.register("266", "#_232", "/components/toolbar/htdocs/controller/toolbar.js");
        expect(component).not.toBeNull();
    });

    it('should have contain a controller', function () {
        expect(component.controller).toBeDefined();
    });

    it('should have a viewContext', function () {
        var controller = component.controller;
        expect(controller.viewContext).toBeDefined();
    });

    it('should have the same instanceId as the component', function () {
        var viewContext = component.controller.viewContext;
        expect(viewContext.instanceId).toBe(component.id);
    });

    it('should have a ClientStorage', function () {
        var viewContext = component.controller.viewContext;
        expect(viewContext.storage).toBeDefined();
    });

    it('should store a key', function () {
        var storage = component.controller.viewContext.storage;

        expect(storage.setValue('test', 'testing')).toBe(true);
    });

    it('should also be able to retrive it', function () {
        var storage = component.controller.viewContext.storage;

        expect(storage.getValue('test')).toBe('testing');
    });
});
