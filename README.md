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

# Installation

*PLEASE NOTE*: Rain is currently under heavy development. I'm not putting too much effort into making sure the head isn't broken. If
you want to test Rain and play with it, use the latest tagged version. See the "Switch Tags" menu at the top of this page. 
You can select a tag by cloning the repository as usual and then checkout the version: 

    $ git clone git@github.com:juxtapos/Rain.git
    $ git checkout <version>

## Requirements

The code has been developed and tested using:

* node.js (0.4.10)
* npm (0.2.19)

Go to the root of your cloned repository and install all required modules with following command:

    $ npm install -d

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

The unit test are nodeunit modules. nodeunit comes with a command, simply execute it with the module you want to test as an argument: 

   $ nodeunit ./test/test-resources.js

If you want to run continuous and automated tests you need:

* ruby (1.8)
* gem (1.3.5)

Install the 'watchr' gem using: 

    $ gem install watchr

In the project root folder execute: 

    $ watchr autotest.watchr

watchr will detect saved files and run all tests (per default in ./test)

WARNING: If you don't really need the run script (because you are not playing with the Rain source), 
do not use it, as it's currently not very stable. 

## "Hot Deploy"

At development time you can use the run.js script that starts a server instance and re-spawns 
it automatically on changes. 

    $ node run.js
    
Use
  server-conf=<PATH_TO_CONFIGFILE>
  module-conf=<PATH_TO_CONFIGFILE>
for custom configuration files

For this to work, you need to start a watchr task, that watches your local source folders 
(currently ./lib/, ./modules) and touches run.js that spawns a server and kills an old one (if any).

    $ watchr reload.watchr

## Setting up socket.io

To play with the socket.io package, you need the client-side library. It comes as a npm module, 
but it is actually not required to run the example as the needed JavaScript files are included in Rain
as part of the 'app' module.  

## Debugging

If you to do serious debugging at development time, you can either use Eclipse plus the chromedevtools, which I find to be pretty unusable. 

Another option is to use the node-inspector (https://github.com/dannycoates/node-inspector), which is pretty awesome but 
unfortunately works only in webkit-based browsers. 

Please note: it currently requires a version of Chrome lower than 14 due to a change in the web sockets protocol support.

Append the 'debug' parameter when executing the run script.  

# Running

For a quick start, you should be ok with the default config file, ./server.conf.default (that comes with sensible defaults now. 
I promise I won't never again use this file locally and push it back to the repository from now on! :-). The server.conf points
to the module.conf.default file per default.

To start the server, execute 

    $ node server.js conf/CONFIGFILE

in the project root folder.

Getting around: 

Call the example page using http://localhost:1337/modules/app/index.html to see a few web components being aggregated on a single page. 'app' is 
a web component itself. You can of course call the each of the embedded web components individually: http://localhost:1337/modules/weather/main.html
or http://localhost:1337/modules/scrollabletable/main.html. Check the view template source files to get an idea how things work. The mapping between 
elements and web components is currently resided in the server config (which breaks decoupling). You can easily add web components by yourself
by simply adding new entries in the server and module configuration.  

*PLEASE NOTE:*

* Currently, you do need a symlink from ./htdocs/instances to the instances folder
* Only expected to work on unixoid machines

* I've set up a local nginx web server (of course you can use whatever you want), whose document root points to the 
Rain project folder. That allows me to quickly check if web components behave the same over file and http. 

# Developing Web Components 

Please refer to the 'weather' module for the required folder structure of Web Components.

# Documentation 

Documentation is very sparse currently. See ./doc/index.html for an API documentation. Use build.sh to create documentation from 
files in ./lib. 
