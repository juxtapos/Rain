var c =console.log;

function HTMLRenderer() {}

HTMLRenderer.getViewBody = function (doc) {
    return doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi)[1];
}

// [TBD] refactor to resource service
var RESOURCE_LOADER_URLPATH = "/resources?files";

HTMLRenderer.renderDocument = function (renderer) {
    var doc         = renderer.renderresult.content,
        d           = renderer.renderresult.dependencies,
        depmarkup   = [];
    if (d.css.length) {
        depmarkup.push('<link rel="stylesheet" type="text/css" href="'
                 , RESOURCE_LOADER_URLPATH, '=', encodeURIComponent(d.css.join(';')), '"/>\n'); 
    }
    if (d.script.length) {
        depmarkup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                 , encodeURIComponent(d.script.join(';')), '"></script>\n');
    }

    var dm = collectClientController(renderer);
    c(dm)
    depmarkup.push(dm);
    // if (doc.indexOf('<style') > -1) {
    //     console.log('...................')
    //     doc = doc.substring(0, doc.indexOf('<style')) + depmarkup.join('') +'xxxxxxxx' + doc.substring(doc.indexOf('<style'));
    // } else {
        doc = doc.substring(0, doc.indexOf('</head>')) + depmarkup.join('') + doc.substring(doc.indexOf('</head>'));
    //}


    return doc;
}

function collectClientController (renderer) {
    var markup = ['<script>'];
    walk(renderer);
    markup.push('</script>');
    return markup.join('\n');
        
    function walk(renderer) {
        var dep = '';
        if (renderer.renderresult.clientcontroller) {
            if (renderer.parentrenderer && renderer.parentrenderer.renderresult.clientcontroller) {
                dep = ',"' + renderer.parentrenderer.renderresult.clientcontroller + '"';
            }
           markup.push('require(["' + renderer.renderresult.clientcontroller + '"' + dep + '], function (controller) { controller.init(); } );');
        }

        renderer.childrenderers.forEach(function (renderer) {
                walk(renderer);
        });
    }
}

exports.HTMLRenderer = HTMLRenderer