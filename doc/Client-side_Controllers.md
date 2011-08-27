# Client-side Controllers

Each webcomponent view may define a client-side controller using three different methods:



## Cascading

The root renderer (i.e. the renderer of the requested resource) traverses the complete render tree 
at the end of the rendering process (i.e. when all its parent renderers are renderered). 

Client-side controllers are loaded using require.js. For this to work, the render process inserts
a set of require() function calls into the rendered document. When a controller is loaded 
client-side, it is initialized with a reference to the component module and a context object (that 
contains dynmamic properties created by the render engine and the client). 

## Context Object

{
	"id" : "<element id in document>",
	""
}