#!/usr/local/bin/node

// changing require.paths as suggested in the example is evil
//require.paths.push(__dirname);
//require.paths.push(__dirname + '/lib');

var testrunner = require('nodeunit').testrunner;

process.chdir(__dirname);

testrunner.run(['test']);
