var redback = require('redback')
    , redbackClient = redback.createClient()
	
//cache = redbackClient.createCache('softporn');
//console.log(require('sys').inspect(redbackClient));
console.log('redis client started');

var channel = redbackClient.createChannel(redbackClient);

channel.publish('foobar', function () {
	console.log('published');
});

channel.subscribe('foobar', function (data) {
	console.log('received ' + data)
})

channel.on('message', function (msg) {
	console.log('message!! ' + msg);
            // assert.equal('foo', msg);
            // if (msg != 'foo') {
            //     assert.ok(false);
            // }
            // received = true;
        });