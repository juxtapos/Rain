var redback         = require('redback')
    , redbackClient = redback.createClient()
    , c             = console.log
    , tagmanager    = null

function init(tm) {
    tagmanager = tm;
}

console.log('redis client started');
var channel = redbackClient.createChannel('rain.intercom');

channel.subscribe(function (data) {
    c('subscribed ' + data);

    channel.on('message', function (msg) {
    console.log(msg);
});
})

