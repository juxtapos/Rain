# What is it? 

Rain (Rapid Application Integration and Development) is a proof-of-concept mini-framework, that
builds upon commonjs modules on the server-side (well, obviously) and on the client-side. 
It is a highly modular approach in building distributed web applications that are assembled at runtime. 
It focuses on fast development of views in pure HTML and CSS. See the wiki for more information at some
not too distant time in the future ;-)

# Requirements

The code has been developed and tested using:

* node.js (0.4.10)
* npm (0.2.19)

Install the following modules using (versions in parenthesis show development versions)

    $ npm install PACKAGENAME

* nodeunit (0.5.1)
* node-xml (1.0.0)
* promised-io (0.2.3)
* jsdom (0.2.0)
* connect (1.4.3)
* socket.io (0.7.7)
* socket.io-client (0.7.4)
* webworker (0.8.4)
* dox (0.0.5) (required only for creating a JSDoc)
* csslint (0.5.0) (required for checking CSS file syntax) 

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

You should be ok with the default config file, ./server.conf.default. To start the server, execute 

    $ node server.js CONFIGFILE

in the project root folder.

Another option is the use the run.js script that starts a server instance and re-spawns 
it automatically on changes. 

    $ node run.js CONFIGFILE

For this to work, you need to start a watchr task, that watches your local source folders 
(currently ./lib/, ./modules) and touches run.js that kills spawns a server and kills the old one. 

PLEASE NOTE: 

* Currently, you do need a symlink from ./htdocs/instances to the instances folder! 
* Only expected to work on unixoid machines

You're done. Happy development :-)

Call the example page using http://localhost:1337/modules/app/index.html first. 

The renderer can be used directly without a web client. Execute 

    $ node lib/test-renderer2.js

# Developing Web Components 

Please refer to the 'weather' module for the required folder structure of Web Components.

# Documentation 

Documentation is very sparse currently. See ./doc/index.html for an API documentation. Use build.sh to create documentation from 
files in ./lib. 
