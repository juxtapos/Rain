var mod_path = require('path')
  , fs = require('fs');

exports.checkValidProject = function(path){
  if(mod_path.existsSync(mod_path.join(path, 'meta.json'))){
    return true;
  }
  
  return false;
};

exports.mothershipIsUp = function(port){
  var files = this.getMothershipList();
  for(var i = files.length; i--;){
    var result = files[i].match(/server\.conf\.([0-9]+)\.([0-9]+)/);
    if(result[1] == port)
      return true;
  }
  
  return false;
};

exports.getServerList = function(){
  var path = mod_path.join(__dirname, '../../.process/s_pid');
  return fs.readdirSync(path);
};

exports.getMothershipList = function(){
  var path = mod_path.join(__dirname, '../../.process/m_pid');
  return fs.readdirSync(path);
};