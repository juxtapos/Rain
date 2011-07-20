# Requirements

The code has been developed and tested using:  

node.js (0.4.9)
npm (0.2.19)

Install the following modules using npm install PACKAGE: 

nodeunit (0.5.1)
node-xml (1.0.0)
promised-io
jsdom (0.2.0)
connect (1.4.3)

# Development

## Continuous Testing

If you want to run continuous and automated tests you need:

ruby (1.8)
gem (1.3.5)

Install the 'watchr' gem using: 

$ gem install watchr

In the project root folder execute: 

$ watchr autotest.watchr

watchr will detect saved files and run all tests (per default in ./test)

# Running

Simple execute 

$ node server.js

in the project root folder.

Another option is the use the run.js script that starts a server instance and re-spawns 
it automatically on changes. 
It works in connection with the watchr used for testing, which must be running for run.js to work.
In case one of the files in /lib, /modules, /test is changed, server.js is touched. run.js 
watches this file, kills the running server and spawns a new one. 

PLEASE NOTE: 
Currently, you do need a symlink from ./htdocs/instances to the instances folder! 

You're done. Happy development :-)

# Developing Web Components 

Please refer to the 'weather' module for the required folder structure of Web Components.
