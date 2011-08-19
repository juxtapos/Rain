/*
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
*/

var logger                  = require('./logger.js').getLogger('miniserver')
    , c                     = console.log
    , mod_fs                = require('fs')
    , mod_cache             = require('./cache.js')
    , mod_resourcemanager   = null
    , mod_tagmanager        = require('./tagmanager.js')
    , parser                = require('./parser.js').parseHtmlView
    , RNDRR                 = require('./renderer.js')

if (process.argv.length < 3) {
    logger.error('usage: server <configfile>');
    process.exit();
}
var config = null;
//logger.info('reading config from ' + process.argv[2]); 
mod_fs.readFile(process.argv[2], function (err, data) {
    if (err) {
        logger.error('error reading configuration');
        process.exit();
    }
    config = JSON.parse(data);
    //logger.info('config loaded');
    mod_cache.configure(config);
    mod_resourcemanager = require('./resourcemanager.js')(config, mod_cache);
    mod_tagmanager.setTagList(config.taglib);

    console.time('render');
    //var r1 = mod_resourcemanager.loadResourceByUrl('file:///Users/cag/workspace/rain/modules/weather/htdocs/main.html');
    //var r1 = mod_resourcemanager.loadResourceByUrl('file:///Users/cag/workspace/rain/modules/scrollabletable/htdocs/main.html');
    //var r1 = mod_resourcemanager.loadResourceByUrl('http://127.0.0.1/modules/app/htdocs/index.html');
    //var r2 = mod_resourcemanager.loadResourceByUrl('http://127.0.0.1/modules/app/htdocs/index.html');
    var r1 = mod_resourcemanager.loadResourceByUrl('file:///Users/cag/workspace/rain/modules/weather/htdocs/main.html');
    //var r3 = mod_resourcemanager.loadResourceByUrl('http://www.spiegel.de');
    //var r4 = mod_resourcemanager.loadResourceByUrl('http://www.spiegel.de');

    var rn1 = new RNDRR.Renderer(r1, parser, mod_tagmanager, mod_resourcemanager);
    // var rn2 = new RNDRR.Renderer(r2);
    // var rn3 = new RNDRR.Renderer(r3);
    // var rn4 = new RNDRR.Renderer(r4);
    
    rn1.render();
    rn1.addListener('stateChanged', function (renderer) {
        if (renderer.state == RNDRR.Renderer.STATES.COMPLETE) {
            c('rendering done')
            console.timeEnd('render');

            //c(renderer.renderResult);
            //rn1.getDependencies();
        }
        
    });
    // rn2.render();
    // rn3.render();
    // rn4.render();
    //rn1.render();
 
});

cols = "                           ";
function show (renderer, col) {
    c('f')
    c(cols.substring(0, col*4) + 'Renderer ' + renderer.resource.url + ' (id ' + renderer.rndid + ')');
    col++;
    renderer._childRenderer.forEach(function (r) { 
        show(r, col);
    });
}