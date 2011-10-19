var mothership = require('./lib/mothership/server.js')
    ,fs = require('fs');

var conf = JSON.parse(fs.readFileSync("./conf/mothership.conf.default").toString());
mothership(conf);