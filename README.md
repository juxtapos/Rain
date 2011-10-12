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

    $ git clone https://github.com/juxtapos/Rain.git
    $ git checkout <version>

## Requirements

The code has been developed and tested using:

* node.js (0.4.11) [http://nodejs.org/] 
* npm (1.0.26) [http://npmjs.org/]

Download both from the given URLs, follow the instructions to install. 

**PEASE NOTE:**
You have to install nodejs-dev package for some modules

Go to the root of your cloned repository and install all required modules with following command:

    $ npm install -d

In case you're curious, the dependencies are pulled from the package.json file. The modules are installed in the folder
node_modules in the project folder. 

**PLEASE NOTE:**

* **Only expected to work on unixoid machines (because of path handling)**
* **You need a symlink to from ./public/modules to ./modules, and from ./public/instances to ./instances. In the project root execute:** 

        $ ln -s ../modules public/modules
        $ ln -s ../instances public/instances

* **node-xml unfortunately doesn't allow configuration of entity resolution. Entities should not be resolved in 
the parser, which is why I patched my local node-xml module.**

* **mu renderer (mustache) is built with a recursive rendering what's end up in stack range problems with big template data.
We have fixed it**

Patches were executed with the installation of the dependencies

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
it automatically on changes. Use run.js instead of ./lib/server.js (for standard operation), both take the same arguments (see Running):

    $ node run.js

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

The debugger is started by adding the 'debug' parameter when executing run.js or ./lib/server.js. 

# Running

For a quick start, you should be ok with the default config file, ./server.conf.default (that comes with sensible defaults now. 
I promise I won't never again use this file locally and push it back to the repository from now on! :-). The server.conf points
to the module.conf.default file per default.

To start the server, in the project root folder execute 

    $ node lib/server.js

Copy the supplied default configuration files once you start adding your own stuff. You can use your own configuration files by the
'module-conf' and 'server-conf' parameters, e.g.:

    $ node lib/server.js module-conf=./conf/module.conf.local server-conf=./conf/server.conf.local

Getting around: 

Call the example page using http://localhost:1337/modules/app/htdocs/index.html to see a few web components being aggregated on a single page. 'app' is 
a web component itself. You can of course call the each of the embedded web components individually: http://localhost:1337/modules/weather/main.html
or http://localhost:1337/modules/scrollabletable/main.html. Check the view template source files to get an idea how things work. The mapping between 
elements and web components is currently resided in the server config (which breaks decoupling). You can easily add web components by yourself
by simply adding new entries in the server and module configuration.  

## Remote Control

If you want to remote control the Rain application server you need to switch on remote control by setting the config
parameter 'remotecontrol' to 'true'. Currently, you can control the TagManager by firing addTag and removeTag messages on a 
redis-cli console (which is awesome, since it enables you to switch render hosts at runtime). 

* Redis (see http://redis.io, 2.2.12)

"Redis is an open source, advanced key-value store. It is often referred to as a data structure server since keys can contain strings, hashes, lists, sets and sorted sets."

# Developing Web Components 

Use the '_skeleton' component as a template for your own components.

# i18n

Rain uses for internationalization gettext. There exists a convention for the po files.
Here is an example for a folder structure:

       appname/htdocs/locales
                         |
                         |- en_US
                         |      \
                         |      |- messages.po
                         |      |- other.po
                         |      o
                         |
                         |- de_DE
                         |      \
                         |      |- messages.po
                         |      |- other.po
                         |      o
                         |
                         |- fr_FR
                         o      \
                                |- messages.po
                                |- other.po
                                o

In this example we have 3 languages and 2 different domains.
So you can easily switch between languages and domains.

**Fallback mechanism**

Rain works in two steps.

1. Rain looks for the standard locale en_US if the given translation dosn't exist and return it.
2. Rain returns the msgid if there is no translation.


Internationalization for mediafiles.
Here is an example for a folder structure:

        appname/htdocs/media
                         |
                         |-  de_DE_filename.extension
                         |-  en_EN_filename.extension
                         |-  en_US_filename.extension


**Following methods are understanding in a template:**

* gettext('msgid')
* ngettext('msgid', 'msgid_plural', number)
* dgettext('domain', 'msgid')
* dgettext('domain', 'msgid', 'msgid_plural', number)
* getmedia('filname.extension')
* getmedia('filname.extension', 'locale_CODE')

Rain loads as default language en\_US. If you want to change this, do it with the query parameter "lang"
e.g.: lang=de\_DE

Example:

    <title>gettext('title')</title>

**TO BE DONE:**

* parameter to gettext, ngettext, getmedia to force a language

# Documentation 

Documentation is very sparse currently, see the ./doc folder and the wiki. 
Use build.sh to create jsdoc documentation from files in ./lib. 

# Licensing

Copyright (c) 2011, Claus Augusti <claus@formatvorlage.de>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
* Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
