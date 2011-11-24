require(
    {
        paths: {
            "core": "components/core-components/htdocs/js",
            "specs": "tests/client/tests"
        }
    },
    ["specs/clientUtil.spec"],
    function () {
        var jasmineEnv = jasmine.getEnv();
        var htmlReporter = new jasmine.HtmlReporter();

        jasmineEnv.addReporter(htmlReporter);

        jasmineEnv.specFilter = function (spec) {
            return htmlReporter.specFilter(spec);
        }

        jasmineEnv.execute();
    }
);
