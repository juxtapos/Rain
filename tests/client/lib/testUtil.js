context = {test: 'test'}
function define(name, callback) {
    context[name] = callback;
}

function require(names, callback) {
    for each (var name in names) {
        callback(new context[name]());
    }
}
