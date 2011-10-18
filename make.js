#!/usr/bin/env node

var fs          = require('fs')
    ,mod_path   = require('path')
    ,colors     = require('colors')
    ,os         = require('os')
    ,content    = ''
    ,root       = mod_path.resolve(mod_path.join(__dirname));


console.log('patching modules...');

var content = fs.readFileSync(mod_path.resolve(__dirname+'/patches/gettext/lib/gettext.js'), 'utf8');
fs.writeFileSync(mod_path.resolve(__dirname+'/node_modules/gettext/lib/gettext.js'), content, 'utf8');
console.log('patched gettext');
  content = fs.readFileSync(mod_path.resolve(__dirname+'/patches/node-xml/lib/node-xml.js'));
fs.writeFileSync(mod_path.resolve(__dirname+'/node_modules/node-xml/lib/node-xml.js'), content, 'utf8');
console.log('patched node-xml');
  content = fs.readFileSync(mod_path.resolve(__dirname+'/patches/mu/lib/mu/renderer.js'));
fs.writeFileSync(mod_path.resolve(__dirname+'/node_modules/mu/lib/mu/renderer.js'), content, 'utf8');
console.log('patched mu');
console.log("3/3 modules patched");
