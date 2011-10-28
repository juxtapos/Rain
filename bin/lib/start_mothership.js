var ms_server = require('rain-mothership')
    ,fs       = require('fs')
    ,mod_path = require('path')
    ,daemon   = require('daemon')
    ,color    = require('colors')
    ,utils    = require('./utils');

var conf_path = process.argv.length == 3 ? process.argv[2] : null;

var ms_server_conf = fs.readFileSync(
    conf_path ? conf_path : mod_path.join(__dirname, '../..', 'init', 'conf', 'mothership.conf.default')
  , 'utf8')
  ,mpid_path = utils.getPidDir()
  ,actPath   = process.cwd()
  ,parsedConf = JSON.parse(ms_server_conf);

//exit process if mothership with same configuration is up
if(utils.mothershipIsUp(parsedConf.server.port)){
  console.log("mothership is still running");
  process.exit(0);
}

ms_server(JSON.parse(ms_server_conf), function(){
  
  daemon.daemonize('/dev/null', null, function(err, pid){
    var daemon_process = this.process;
    if (err) {
      return sys_util.puts('Error starting daemon: ' + err);
    }
    
    daemon_process.title = "rain-mothership";
    
    //create configurationfile
    var ms_server_prop_file = [
      '{',
      '  "pid" : '+pid+',',
      '  "path" : "'+actPath+'",',
      '  "conf" : '+ms_server_conf,
      '}'
    ].join('\n');
    var conf_mpid    = mod_path.join(mpid_path, "rain.ms."+parsedConf.server.port+"."+pid);
    //write server config
    fs.writeFileSync(conf_mpid, ms_server_prop_file);
    //clear conf files if server shutting down
    daemon_process.on('SIGTERM', function(){
      fs.unlinkSync(conf_mpid);
      daemon_process.exit(0);
    });
    
    daemon_process.on('uncaughtException', function (err) {
      console.log('Caught exception: ' + err);
      daemon_process.kill(pid, 'SIGTERM');
    });
  });
});