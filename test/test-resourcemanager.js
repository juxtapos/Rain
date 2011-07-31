var nodeunit            = require('nodeunit')
    , mod_resmanager    = require('../lib/resourcemanager.js')
    , mod_promise       = require('promised-io')
    , mod_cache         = require('../lib/Cache.js')
    , mod_path          = require('path')

module.exports = nodeunit.testCase({
    setUp : function (callback) {
        mod_resmanager.configure({"caching": { "resources":true } }, mod_cache);
        callback();
    }

    , testSingleFileUrl : function (test) {
        var r = mod_resmanager.getResource('file://' + mod_path.join(__dirname, '..', 'lib', 'server.js'));
        r.then(function (data) {
            test.done();    
        });
    } 

    , testRelativePaths : function (test) {
        var r = mod_resmanager.getResource('/lib/server.js');
            r.then(function (data) {
            test.done();    
        }); 
    }
    
    , testManyRelativePaths : function (test) {
        var r = mod_resmanager.getResources( [ 'lib/server.js' 
                                              , '/lib/server.js'
                                              , 'foo/bar/baz/../../../lib/server.js']);
            r.then(function (data) {
            test.done();    
        }); 
    }
    

    // , testSameResource : function (test) {
    //     var r = mod_resmanager.getResources( [ 'lib/server.js' 
    //                                           , '/lib/server.js'] );
    //     r.then(function (data) {
    //         // [TBD] hmmmm... now to test for equality? gids? 
    //         test.equal(data[0], data[1]);
    //         test.done();    
    //     }); 
    // } 

    , testManyFileUrls : function (test) {
        var r = mod_resmanager.getResources( [ 'file://' + mod_path.join(__dirname , '..', 'lib', 'server.js')
                                                ,'file://' + mod_path.join(__dirname, '..'
                                                , 'modules', 'app', 'htdocs', 'index.html')
                                            ]).then(function () {
                                                test.done();
                                            }); 
    }
});