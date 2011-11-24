function init(elementid) {
	console.log('init toolbar component');

    this.viewContext.publish('::comp::ns::event');
    var callback = function () {
        console.log('Hello World!');
    }
    this.viewContext.subscribe('::comp::ns::event', callback);
    this.viewContext.subscribe('::comp::ns::event', function () {
        console.log('Hello Foo!');
    });
    this.viewContext.subscribe('comp::ns', function () {
        console.log('Hello Bar!');
    }, this.viewContext);

    this.viewContext.publish('::comp::ns::event');
    this.viewContext.publish('comp::ns');
    this.viewContext.unsubscribe('::comp::ns::event', callback);
    this.viewContext.publish('::comp::ns::event');
}

define(function () {
	
	return {
		init : init
	}
});
