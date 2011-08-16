A view template author may express URLs in markup in three different schemes: 

1. relative HTTP URLs, e.g. href="htdocs/application.css"
2. full qualified HTTP URLs, e.g. href="http://cdn.rain.com/reset.css"
3. Web Component protocol URLs, e.g. href="webcomponent://domains;1.0/application.css"

Only full qualified URLs are delivered as is, relative HTTP URLs and Web Component URLs are rewritten 
by the application server to point to correct public (runtime) HTTP URLs.


URLs in View Templates

<link rel="stylesheet" href="/my/path/to.file"/>

Defined relative to from <module>/htdocs/. 

<link rel="stylesheet" href="webcomponent://app;1.0/my/path/to.file"/>

