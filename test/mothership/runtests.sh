#!/usr/bin/node

var   path    = require('path')
    , fs      = require('fs')
    , spawn   = require('child_process').spawn
    , serverlist = []


//c('starting mothership');
//var mothership = spawn('node', ['../../run_mothership']);
//c('mothership started');

//mothership.stdout.on('data', function(data){
//  c(data);
//})

for(var i = 1; i <100; i++){
  var server = spawn('node', ['../../run', 'server-conf=conf/server.conf.'+i]);
  serverlist.push(server);
}


function c(message){
  var time = new Date();
  console.log(time + '  ---  '+message);
}