#!/usr/bin/node

var   path    = require('path')
    , fs      = require('fs')
    , config  = fs.readFileSync(__dirname + '/conf/server.conf.default', 'utf8');


var portFrom = 39000,
    portTo   = 40000,
    i = 1;

while(portFrom <= portTo){
  fs.writeFileSync(__dirname+'/conf/server.conf.'+i++, config.replace('{{port}}', portFrom++), 'utf8');
}
