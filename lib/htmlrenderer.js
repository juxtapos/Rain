function HTMLRenderer() {}

HTMLRenderer.getViewBody = function (doc) {
    return doc.match(/<body[^>]*>([\s\S]*)<\/body>/mi)[1];
}

// [TBD] refactor to resource service
var RESOURCE_LOADER_URLPATH = "/resources?files";

HTMLRenderer.renderDocument = function (doc, d) {
    var depmarkup = [];
    if (d.css.length) {
        depmarkup.push('<link rel="stylesheet" type="text/css" href="'
                 , RESOURCE_LOADER_URLPATH, '=', encodeURIComponent(d.css.join(';')), '"/>\n'); 
    }
    if (d.script.length) {
        depmarkup.push('<script type="application/javascript" src="', RESOURCE_LOADER_URLPATH, '='
                 , encodeURIComponent(d.script.join(';')), '"></script>\n');
    }

    // if (doc.indexOf('<style') > -1) {
    //     console.log('...................')
    //     doc = doc.substring(0, doc.indexOf('<style')) + depmarkup.join('') +'xxxxxxxx' + doc.substring(doc.indexOf('<style'));
    // } else {
        doc = doc.substring(0, doc.indexOf('</head>')) + depmarkup.join('') + doc.substring(doc.indexOf('</head>'));
    //}

    return doc;
}

exports.HTMLRenderer = HTMLRenderer