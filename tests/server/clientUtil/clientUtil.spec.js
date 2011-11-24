var requirejs = require("requirejs");

requirejs(["../../../components/core-components/htdocs/js/client_util.js"], function (modUtil) {

    describe("clientUtil", function () {
        describe("bind", function () {
            it("validates parameters", function () {
                expect(function () { modUtil.bind(null); }).toThrow(TypeError);
            });
        });
    });

});
