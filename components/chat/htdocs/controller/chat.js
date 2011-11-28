define(function () {
    var socket;

    function init () {
        socket = this.viewContext.getWebSocket('chat/protocol');
        configureSocket();
    }

    function configureSocket() {
        socket.on('bye', function (data) {
            console.log('recived bye with data: ');
            console.log(data);
        });
    }

    return {
        init: init
    }
});
