# What is it? 

Rain is a proof-of-concept architecture, that
builds upon commonjs modules on the server-side (well, obviously) and on the client-side. 
It is a highly modular approach in building distributed web applications that are assembled at runtime. 
It focuses on fast development of views in pure HTML and CSS. 

Rain believes in resources, it loves REST and the web. Many "things" in Rain are modeled as resources. Resources may depend on each other 
at different times of their life-cycle. They may be required only at client display time, or earlier on server-side 
rendering time. Rain takes care of dependencies, which is one of the very reasons for rain to exist. At runtime, 
it can be an elastic network of resources and resource hosts, hosting and serving different types of data 
to various types of clients.

In terms of GUI development, Rain uses a poor-rich client approach: as many things as possible are pushed towards the upper layer 
(i.e. towards a web client), but control of interaction that goes beyond UI interaction is always at least indirectly controlled by the 
application server. The server-side application only knows about URLs and services and injects those into the client runtime. 

See the wiki for more information at some
not too distant time in the future ;-)

# Requirements

The code has been developed and tested using:

* node.js (0.4.10)
* npm (0.2.19)

Install the following modules using (versions in parenthesis show the versions I have used on my Mac OS X development system)

    $ npm install PACKAGENAME

* nodeunit (0.5.1)
* node-xml (1.0.0)
* promised-io (0.2.3)
* jsdom (0.2.0)
* connect (1.4.3)

Please note: some people have reported problems trying to install promised-io via npm. If it doesn't work 
for you, clone the repository at https://github.com/kriszyp/promised-io.git, cd into the module root folder, and install using

    $ npm install . 

Optional:

* socket.io (0.7.7) (only if you set the config parameter 'websockets' to 'true')
* socket.io-client (0.7.4) (only if you set the config parameter 'websockets' to 'true')
* webworker (0.8.4) (only if you set the config parameter 'websockets' to 'true')
* dox (0.0.5) (required only for creating a JSDoc)
* csslint (0.5.0) (only required for checking CSS file syntax) 

## Remote Control

If you want to remote control the Rain application server you need to switch on remote control by setting the config
parameter 'remotecontrol' to 'true'. Currently, you can control the TagManager by firing addTag and removeTag messages on a 
redis-cli console (which is awesome, since it enables you to switch render hosts at runtime). 

* Redis (see http://redis.io, 2.2.12)

"Redis is an open source, advanced key-value store. It is often referred to as a data structure server since keys can contain strings, hashes, lists, sets and sorted sets."

* redback (0.2.7) (only if config parameter 'remotecontrol' set to 'true')
* redback (0.2.7) (only if config parameter 'remotecontrol' set to 'true')

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

## "Hot Deploy"

At development time you can use the run.js script that starts a server instance and re-spawns 
it automatically on changes. 

    $ node run.js CONFIGFILE

For this to work, you need to start a watchr task, that watches your local source folders 
(currently ./lib/, ./modules) and touches run.js that spawns a server and kills an old one (if any).

    $ watchr reload.watchr

## Setting up socket.io

To play with the socket.io package, you need the client-side library. It comes as a npm module, 
but it is actually not required to run the example as the needed JavaScript files are included in Rain
as part of the 'app' module.  

# Running

For a quick start, you should be ok with the default config file, ./server.conf.default (that comes with sensible defaults now. 
I promise I won't never again use this file locally and push it back to the repository from now on! :-)

To start the server, execute 

    $ node server.js CONFIGFILE

in the project root folder.

PLEASE NOTE: 

* Currently, you do need a symlink from ./htdocs/instances to the instances folder! [don't think it's true anymore...?]
* Only expected to work on unixoid machines

* I've set up a local nginx web server (of course you can use whatever you want), whose document root points to the 
Rain project folder. That allows me to quickly check if web components behave the same over file and http. 

You're done. Happy development :-)

Call the example page using http://localhost:1337/modules/app/index.html first. 

# Developing Web Components 

Please refer to the 'weather' module for the required folder structure of Web Components.

# Documentation 

Documentation is very sparse currently. See ./doc/index.html for an API documentation. Use build.sh to create documentation from 
files in ./lib. 
