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