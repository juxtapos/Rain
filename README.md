# What is it? 

Rain (Rapid Application Integration and Development) is a proof-of-concept mini-framework, that
builds upon commonjs modules on the server-side (well, obviously) and on the client-side. 
It is a highly modular approach in building distributed web applications that are assembled at runtime. 
It focuses on fast development of views in pure HTML and CSS. See the wiki for more information at some
not too distant time in the future ;-)

# Requirements

The code has been developed and tested using:

* node.js (0.4.9)
* npm (0.2.19)

Install the following modules using 

    $ npm install PACKAGENAME

* nodeunit (0.5.1)
* node-xml (1.0.0)
* promised-io
* jsdom (0.2.0)
* connect (1.4.3)
* socket.io (0.7.7)
* socket.io-client (0.7.4)

# Development

## Continuous Testing

If you want to run continuous and automated tests you need:

* ruby (1.8)
* gem (1.3.5)

Install the 'watchr' gem using: 

    $ gem install watchr

In the project root folder execute: 

    $ watchr autotest.watchr

watchr will detect saved files and run all tests (per default in ./test)

## Setting up socket.io

To play with the socket.io package, you need the client-side library. It comes as a npm module, 
but it is actually not required to run the example as the needed JavaScript files are included in Rain
as part of the 'app' module.  

# Running

Simply execute 

    $ node server.js

in the project root folder.

Another option is the use the run.js script that starts a server instance and re-spawns 
it automatically on changes. 
It works in connection with the watchr used for testing, which must be running for run.js to work.
In case one of the files in /lib, /modules, /test is changed, server.js is touched. run.js 
watches this file, kills the running server and spawns a new one. 

PLEASE NOTE: 

* Currently, you do need a symlink from ./htdocs/instances to the instances folder! 
* Only expected to work on unixoid machines

You're done. Happy development :-)

# Developing Web Components 

Please refer to the 'weather' module for the required folder structure of Web Components.
