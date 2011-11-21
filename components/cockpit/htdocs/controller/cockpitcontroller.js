function init () {
	console.log('cockpitcontroller init');
    this.viewContext.storage.set('asdasd', 'asd', true);
}

define(function () {
	
	return {
		init	 : init
	}
});
