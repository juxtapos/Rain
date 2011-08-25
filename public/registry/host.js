var redback         = require('redback')
    , redbackClient = redback.createClient()
    , c             = console.log

c('starting')

console.log('redis client started');
var channel = redbackClient.createChannel('rain.intercom');


channel.publish('Hello World ' + new Date().getTime(), function (e) {
	//c('pub')
});

c('end');


/* 


- hub is started
- opens channel to redis
- starts listening

- inidivudal host start up 
- register at registry using the channe opened by hub 
- message is disrtibuzed by hub 
- tagmanager is updated 
- module available


*/