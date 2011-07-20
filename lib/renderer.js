var xml         = require('node-xml')
    ,mod_promise = require('promised-io');

exports.parse = parse;

const RESOURCE_LOADER_URLPATH = "/resources?files";

function renderDependencies(doc, output, tags, resources, mode, defer) {
  if (mode !== 'json') {
    var markup = [];
    
    // add CSS required by requested view
    markup.push('<link rel="stylesheet" type="text/css" href="');
    markup.push(RESOURCE_LOADER_URLPATH);
    markup.push('=');
    markup.push(resources.css.join(';'));
    markup.push('"/>'); 

    // add JavaScript required by requested view
    markup.push('<script type="application/javascript" src="');
    markup.push(RESOURCE_LOADER_URLPATH);
    markup.push('=');
    markup.push(resources.script.join(';'));
    markup.push('"></script>');

    // add module requires and initializer calls
    markup.push('<script type="application/javascript">');
    for (var i = 0, tag; i < tags.length; i++) {
      tag = tags[i];
      var im = tag.instanceid ? ',"text!/instances/' + tag.instanceid + '.js"' : '';
      markup.push('\nrequire(["/modules/');
      markup.push(tag.element.module)
      markup.push('/client.js", "text!/modules/');
      markup.push(tag.element.module);
      markup.push('/main.html?type=json"');
      markup.push(im);
      markup.push('], function (module, template, instance) { module.initView("');
      markup.push(tag.id);
      markup.push('", template, instance) } );');
    } 
    markup.push('\n</script>');

    // insert into parsed document
    var doc = output.join('');
    var idx = doc.indexOf('</head>');
    doc = doc.substring(0, idx) + markup.join('') + doc.substring(idx, doc.length);

    defer.resolve(doc);
  } else {
    var body = output.join('').match(/(<body[^>]*>)([\s\S]*)(<\/body>)/mi)[2];
    var obj = { 
      "resources" : {
        "css"       : resources.css
        , "script"  : resources.script
      }
      , "content" : body
    };
    defer.resolve(JSON.stringify(obj));
  }
}

function parse(url, doc, tagmanager, mode) {
  var defer = mod_promise.defer()
      ,parser = new xml.SaxParser(new DocParser(defer, renderDependencies));

  parser.parseString(doc);

  return defer;

  function DocParser(defer, callback) {
    var elements = []
        ,tags = {}
        ,outputBuffer = []
        , cssresources = []
        , scriptresources = [] 
        , tagRemoved = false;

    return function (cb) {
      cb.onStartDocument(function() {
        //console.log('................ ' + wasAdded);
      });

      cb.onEndDocument(function() {
        resources = {
          'css'       : cssresources
          , 'script'  : scriptresources
        }
        callback(doc, outputBuffer, elements, resources, mode, defer);
      });

      cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
          //sys.puts("=====> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");

          var instanceid, u;
          tagRemoved = false;

          if (elem === 'link') {
            attrs.forEach(function (item) {
              if (item[0] === 'href') {
                if (item[1].indexOf('://') === -1) {
                   u = url + item[1];
                }
                cssresources.push(u);
              }
            });
            tagRemoved = true;
          } else if (elem == 'script') {
            attrs.forEach(function (item) {
              if (item[0] === 'src') {
                if (item[1].indexOf('://') === -1) {
                   u = url + item[1];
                }
                scriptresources.push(u);
              }
            });
            tagRemoved = true;
          } else {
            for (var i = 0; i < attrs.length; i++) {
              if (attrs[i][0] === 'instanceid') {
                //console.log('found instance id');
                instanceid = attrs[i][1];
                break;
              }
            }

            var tag = tagmanager.getTag(elem, attrs, prefix, uri, namespaces);
            if (tag !== null) {
              //console.log('found tag ' + tag.selector);
              var id = tag.namespace + '|' + tag.selector;
              //if (typeof tags[id] === 'undefined') {
                //console.log('adding tag : ' + id);
                tags[id] = tag;
              //} else {
                //console.log('tag already included ' + id);
              //}
              var eid = addId(attrs);
              var a = {
                'id' : eid
                , 'element' : tag
                , 'instanceid' : instanceid
                , 'resources' : 
                {
                  'css' : cssresources, 
                  'script' : {}
                } 
              };
              elements.push(a);  
            }
            
            copy(elem, attrs, prefix, uri, namespaces);   
          }

          
          function copy(elem, attrs, prefix, uri, namespaces) {
            outputBuffer.push("<" + (prefix ? prefix + ":" : "") + elem);
            if (namespaces.length > 0 || attrs.length > 0) {
              outputBuffer.push(" ");
            }
            /*for (i = 0; i < namespaces.length; i++) {
              outputBuffer.push("xmlns:" + namespaces[i][0] + "=\"" + namespaces[i][1] + "\" ");
              savedNamespaces[namespaces[i][1]] = namespaces[i][0]; 
            }*/
            for (var i = 0; i < attrs.length; i++) {
              outputBuffer.push(attrs[i][0] + '="' + attrs[i][1] + '"');
              if (i < attrs.length-1) outputBuffer.push(' ');
            }

            if (['meta', 'link', 'br', 'img', 'input'].indexOf(elem) > -1) {
              outputBuffer.push('/>')
            } else {
              outputBuffer.push('>');
            }
          }

          /**
           * add an 'id' attribute to identify the element when inserting its rendered content
           */
          function addId(attrs) {
            var eid
                , elemId = "module" + new Date().getTime() + "" + parseInt(Math.random()*10);
            for (var j = 0, al = attrs.length, hasId = false; j < al; j++) {
              if (attrs[j][0] === "id") {
                eid = attrs[j][1];
                hasId = true;
              }
            }
            if (!hasId) {
              attrs.push(["id", elemId]);
              return elemId
            } else {
              return eid;
            }
          }
      });

      cb.onEndElementNS(function(elem, prefix, uri) {
          if (!tagRemoved) {
            outputBuffer.push("</" + (prefix ? prefix + ":" : "") + elem +">");
          }
          tagRemoved = false;
      });

      cb.onCharacters(copy);
      cb.onCdata(copy);
      cb.onComment(copy);

      function copy(chars) {
        outputBuffer.push(chars);
      };

      cb.onWarning(function(msg) {
          console.log('warning ' + msg);
      });

      cb.onError(function(msg) {
          console.log('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
      });
    }
  }
}