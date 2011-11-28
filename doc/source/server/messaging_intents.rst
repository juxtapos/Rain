=======
Intents
=======

In this document you can find usefull about intents and how they are implemented on server
side.

----------------
Defining intents
----------------

Each RAIN component can define intents. The only constraint is not to define the same intent
within the same component.

Currently a component can define the following intent types:

   + Intents that return views (this are mapped on component views)
   + Intents that execute a server side action and return their result (intent mapped on a nodejs module method).
   
In meta.json file each component can use the following format to define intents::

   "intents": [...
   {"action": "...",
    "category": "...",
    "type": "view" | "server",
    "provider: "...",
    optional_attributes
   ...]
   
Optional attributes are defined only for certain types of intents.
   
Intents mapped on views
-----------------------

This intent always return a json object that describes a view. Below you can find how 
intents mapped on views are defined::

    ...
    "views": [
        {"viewid": "missing_intent",
         "view": "/htdocs/missing_intent_example.html",
         "controller": "/htdocs/scripts/missing_intent_example.js"}
    ],
    "intents": [{
        "action": "com.rain.test.general.SHOW_CHAT",
        "category": "com.rain.test.general",
        "type": "view",
        "provider": "missing_intent" 
    },
    ....

For this kind of intents provider is matched against a component viewId. If the viewId
is not found than the registration process will throw an error.