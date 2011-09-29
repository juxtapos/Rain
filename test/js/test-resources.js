var nodeunit            = require('nodeunit')
    , mod_resources     = require('resources.js')
    , Resource          = mod_resources.Resource
    , promises          = require('promised-io/promise')
    , assert            = require('assert')
    , mod_path          = require('path')

module.exports = nodeunit.testCase({
    setUp : function (callback) {
        callback();
    },

    simpleDependency : function (test) {
        var url1 = 'file://' + mod_path.join(__dirname, './testfiles/server.js')
            , url2 = 'http://127.0.0.1:1338/'

        var r1 = new Resource(url1);
        var r2 = new Resource(url2);
        r1.addDependency(r2);

        r1.load();
        r1.loadDependencies();

        r1.addListener('stateChanged', function (resource) {
            if (resource.state == Resource.STATES.COMPLETE) test.done();

        });
    }, 

    chainImplicit : function (test) {
        var url1 = 'file://' + mod_path.join(__dirname, './testfiles/server.js')
            , url2 = 'http://127.0.0.1:1338/'
            , url3 = 'file://' + mod_path.join(__dirname, './testfiles/index.html')

        var r1 = new Resource(url1);
        var r2 = new Resource(url2);
        var r3 = new Resource(url3);
        r1.addDependency(r2);
        r2.addDependency(r3);

        r1.load();
        r2.load();
        r3.load();

        r2.state = Resource.STATES.LOADING;

        r1.addListener('stateChanged', function (resource) {
            if (resource.state == Resource.STATES.COMPLETE) {
                test.done();
            }
        });
    },

    complexDependencies : function (test) {
        var url1 = 'file://' + mod_path.join(__dirname, './testfiles/server.js')
            , url2 = 'file://' + mod_path.join(__dirname, './testfiles/index.html')
            , url3 = 'file://' + mod_path.join(__dirname, './testfiles/index.html')
            , url4 = 'http://127.0.0.1:1338/'

        var r1 = new Resource(url1);
        var r2 = new Resource(url2);
        var r3 = new Resource(url3);
        var r4 = new Resource(url4);
        r3.addDependency(r4);
        r1.addDependency(r2);
        r1.addDependency(r3);

        r1.load();
        r1.loadDependencies();
        r2.load();
        r3.load();
        r4.load();

        r1.addListener('stateChanged', function (resource) {
            console.log(resource.uuid + ': state ' + resource.state);
            if (resource.state == Resource.STATES.COMPLETE) {
                test.done();
            }
        });
    },

    addDependencyAfterLoadStarted : function (test) {
        var url1 = 'file://' + mod_path.join(__dirname, './testfiles/server.js')
            , url2 = 'file://' + mod_path.join(__dirname, './testfiles/index.html');
        var r1 = new Resource(url1);
        var r2 = new Resource(url2);
        r1.load();
        r1.addDependency(r2);
    r2.load();
    r1.addListener('load', function (resource) {
      test.done();
    });
    }
});
