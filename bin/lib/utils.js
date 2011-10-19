var mod_path = require('path')
  , fs = require('fs');

exports.checkValidProject = function(path){
  return mod_path.existsSync(mod_path.join(path, '.rain'));
};

exports.checkPidDirectory = function(){
  //create process directories
  if(mod_path.existsSync(this.getPidDir()))
      return true;
  return false;
};

exports.componentExists = function(component_path){
  return mod_path.existsSync(component_path);
};

exports.createPidDirectory = function(){
  //create process id directory
  fs.mkdirSync(this.getPidDir(), 0775);
};

exports.mothershipIsUp = function(port){
  var files = this.getMothershipList();
  for(var i = files.length; i--;){
    var result = files[i].match(/rain\.ms\.([0-9]+)\.([0-9]+)/);
    if(result[1] == port)
      return true;
  }
  
  return false;
};

exports.getPidDir = function(){
  return mod_path.resolve(process.env.HOME || process.env.UserProfile, '.rain');
};

exports.serverIsUp = function(project_path){
  if(mod_path.existsSync(mod_path.join(project_path, '.server'))){
    return true;
  }
  
  return false;
};

exports.getServerPIDContent = function(path){
  var result = fs.readFileSync(path).toString().match(/^([0-9]+) (.+)/);
  return [result[1], result[2]];
};

exports.getServerList = function(){
  var files = fs.readdirSync(this.getPidDir()),
      serverfiles = [];
  
  for(var i = files.length; i--;){
    if(~files[i].indexOf('rain.server'))
      serverfiles.push(files[i]);
  }
  return serverfiles;
};

exports.getMothershipList = function(){
  var files = fs.readdirSync(this.getPidDir()),
      serverfiles = [];

  for(var i = files.length; i--;){
    if(~files[i].indexOf('rain.ms'))
      serverfiles.push(files[i]);
  }
  return serverfiles;
};