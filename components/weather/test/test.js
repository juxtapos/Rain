var content = require('fs').readFileSync('./testfile.txt').toString();
var desc = content.match(/<!\[CDATA\[([\s\S]+)\]\]>/m)[0];

console.log(desc);