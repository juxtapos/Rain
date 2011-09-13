
var crypto = require('crypto')
  , Path = require('path')
  , fs = require('fs')
  , uuid = 0;

exports.createUUID = function(){
  return crypto.createHash('sha1').update((new Date()).getTime()+'make it RAIN baby'+uuid++).digest('hex');
};