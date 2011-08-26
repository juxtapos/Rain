#!/usr/local/bin/node

// changing require.paths as evil
require.paths.push(require('path').join(__dirname, '..', 'lib'));
var testrunner = require('nodeunit').testrunner;
process.chdir(__dirname);

testrunner.run(['js']);
