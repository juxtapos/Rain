var wrench    = require('wrench')
    ,fs       = require('fs')
    ,mod_path = require('path');

module.exports = function(options){
  wrench.copyDirSyncRecursive(mod_path.resolve(mod_path.join(__dirname, '../../../init/skeletons/nodejs')), options.path);
  
  //manipulate meta.json
  var metajs = fs.readFileSync(options.path+'/meta.json', 'utf8').replace(/\{\{application_name\}\}/g, options.name);
  fs.writeFileSync(options.path+'/meta.json', metajs, 'utf8');
  
  //manipulate client-controller.js
  var metajs = fs.readFileSync(options.path+'/htdocs/controller/index.js', 'utf8').replace(/\{\{application_name\}\}/g, options.name);
  fs.writeFileSync(options.path+'/htdocs/controller/index.js', metajs, 'utf8');
};