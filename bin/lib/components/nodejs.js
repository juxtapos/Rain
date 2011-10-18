var wrench    = require('wrench')
    ,fs       = require('fs')
    ,mod_path = require('path');

module.exports = function(options){
  wrench.copyDirSyncRecursive(mod_path.resolve(mod_path.join(__dirname, '../../../init/skeletons/nodejs')), options.path);
  var metajs = fs.readFileSync(options.path+'/meta.json', 'utf8').replace(/\{\{application_name\}\}/g, options.name);
  fs.writeFileSync(options.path+'/meta.json', metajs, 'utf8');
};