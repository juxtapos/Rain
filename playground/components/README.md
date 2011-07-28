Heavily awesome stuff: node.js REPL on a TCP Socket. 

Execute

    $ node main.js 

and on another shell execute 

    $ telnet 127.0.0.1 1338 

to get to main.js's REPL

In the REPL, execute 

    $ tc1 = registerService('tc1'); // (or r('tc1'))

Registering it again will reload the module by invalidating node.js's require cache. 

Exevute 

    $ tc2 = registerService('tc2');

tc2 subscribes to events of tc1. Execute 

    $ tc1.send();

This is an experiment on how to deal with complex nodejs/commonjs applications, that require 
some kind of 'singleton' modules to be available (usually some kind of managers). Dealing with 
these dependencies is cumbersome and errorprone. An OSGI-like approach is something worth 
thinking about. 

A module needs to export some kind of 'component behavior object' for this to work. Backreferences 
to the 'main controller' injected into a component at init() time exposes only the export object to 
comply with commonjs module behavior. 

Re-registering a module does not add event handlers again, must implement function in main. 