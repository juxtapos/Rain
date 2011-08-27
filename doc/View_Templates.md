a view template is a resource. 

dependencies are either server-side or client-side, runtime and loadtime. 

a view template may have the following dependencies that are created by a template author: 

css -> <link /> client-side, loadtime
javascript -> <script /> client-side, loadtime
javascript -> controller client-side
data sources -> server-side, runtime

a data source is any resource
data source URLs may be created dynamically

webcomponents may have two types of controllers: 

component controller - called implicitly when accessing the view of a component, contains lifecycle methods. 
view controller - a view controller is either executed client- or server-side, based on the render mode.

 