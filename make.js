#!/usr/bin/env node

var fs          = require('fs')
    ,mod_path   = require('path')
    ,colors     = require('colors')
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

//create process directories
console.log(mod_path.join(root, '.process'));
fs.mkdirSync(mod_path.join(root, '.process'), '755');
fs.mkdirSync(mod_path.join(root, '.process', 's_pid'), '755');
fs.mkdirSync(mod_path.join(root, '.process', 'm_pid'), '755');
fs.writeFileSync(mod_path.join(root, '.process', 'mothershiplist.json'), '', 'utf8');
console.log("created process structure".green);