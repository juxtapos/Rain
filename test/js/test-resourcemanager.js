var nodeunit            = require('nodeunit')
    , mod_resmanager    = require('resourcemanager.js')(true, true)
    , mod_promise       = require('promised-io/promise')
    , mod_cache         = require('cache.js')
    , mod_path          = require('path')
    , Resource          = require('resources.js').Resource

module.exports = nodeunit.testCase({
    testSingleFileUrl : function (test) {
        var r = mod_resmanager.getResource('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js'));
        r.then(function (data) {
            test.done();    
        });
    },

    testRelativePaths : function (test) {
        var r = mod_resmanager.getResource('/lib/server.js');
            r.then(function (data) {
            test.done();    
        }); 
    },
    
    testManyRelativePaths : function (test) {
        var r = mod_resmanager.getResources( [ 'lib/server.js' 
                                              , '/lib/server.js'
                                              , 'foo/bar/baz/../../../lib/server.js']);
            r.then(function (data) {
            test.done();    
        }); 
    },
    


    testManyFileUrls : function (test) {
        var r = mod_resmanager.getResources( [ 'file://' + mod_path.join(__dirname , '..', 'lib', 'server.js')
                                                ,'file://' + mod_path.join(__dirname, '..'
                                                , 'modules', 'app', 'htdocs', 'index.html')
                                            ]).then(function () {
                                                test.done();
                                            }); 
    },

    /*
    only when cache is working and on
    testSame : function (test) {
        var r1 = mod_resmanager.getResourceByUrl('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js')); 
        var r2 = mod_resmanager.getResourceByUrl('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js')); 
        test.equal(r1, r2);
        test.done();
    },
    */

    testStateChange : function (test) {
        var r = mod_resmanager.getResourceByUrl('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js').load());
        r.addListener('stateChanged', function (resource) {
            test.equal(resource, r);
            test.ok(resource.state >= Resource.STATES.INIT && resource.state <= Resource.STATES.COMPLETE);
            test.done();
        });
    },

    loadEvent : function (test) {
        var r = mod_resmanager.getResourceByUrl('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js').load());    
        r.addListener('load', function (resource) {
            test.equal(resource, r);
            test.ok(resource.state > 0);
            test.done();
        });
    }
});
