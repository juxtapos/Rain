var c = console.log

function doGet (request, response) {
	response.write('get on app main.js');
}

function doPost (request, response) {
	
}

function doDelete (request, response) {
	
}

function doPut (request, response) {
	
}

exports.get = doGet;
exports.post = doPost;
exports.delete = doDelete;
exports.put = doPut;