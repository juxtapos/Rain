"use strict";

/**  
 * Some test code for remote controlling a Rain instance over redis channel messaging. 
 * 
 */

var redback         = require('redback')
    , redbackClient = redback.createClient()
    , c             = console.log
    , tagmanager    = null

function init(tm) {
    tagmanager = tm;
}

console.log('redis client started');
var channel = redbackClient.createChannel('rain.tagmanager');

channel.subscribe(function (data) {
    //c('subscribed ' + data);
})

channel.on('message', function (msg) {
    console.log(msg);
    dispatch(msg);
});

function dispatch(msg) {
    if (msg.indexOf('addTag') == 0) {
        if (tagmanager) {
            tagmanager.addTag(JSON.parse(msg.match(/\{.*\}/)[0]));
        }
    }
    if (msg.indexOf('removeTag') == 0) {
        if (tagmanager) {
            tagmanager.removeTag(msg.match(/['"](.*)['"]/)[1]);
        }
    }
}

exports.init = init;