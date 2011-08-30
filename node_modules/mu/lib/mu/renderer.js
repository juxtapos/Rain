var BUFFER_LENGTH = 1024 * 8;

var parser = require('./parser'),
    baseProto = ({}).__proto__;

exports.render = render;

function render(tokens, context, partials, stream, callback) {
  if (tokens[0] !== 'multi') {
    throw new Error('Mu - WTF did you give me? I expected mustache tokens.');
  }

  //if (!Array.isArray(context)) {
  //  context = [context];
  //}
  
  for(var i = 1, tokenLen = tokens.length; i <= tokenLen; i++){
    if(i < tokenLen){
      next(tokens[i]); 
    } else {
      next(null);
    }
  }
  
  function next(token) {
    try {
    
      if (stream.paused) {
        stream.on('drain', function () {
          process.nextTick(next);
        });
        return;
      }
    
      if (!token) {
        return callback ? callback() : true;
      }
    
      switch (token[0]) {
      case 'static':
        stream.emit('data', token[2]);
        return;
    
      case 'mustache':    
        switch (token[1]) {
        case 'utag': // Unescaped Tag
          stream.emit('data', s(normalize(context, token[2])));
          return;
        
        case 'etag': // Escaped Tag
          stream.emit('data', escape(s(normalize(context, token[2]))));
          return;
      
        case 'section':
          var res = normalize(context, token[2], token[3]);
          if (res) {
            return section(context, token[2], res, token[4], partials, stream, next);
          } else {
            return;
          }
        
        case 'inverted_section':
          var res = normalize(context, token[2], token[3]);
          if (!res || res.length === 0) {
            return section(context, token[2], !res, token[4], partials, stream, next);
          } else {
            return;
          }
        
        case 'partial':
          var partial = partials[token[2]];
          // console.log(require('util').inspect(partials));
          if (partial) {
            return render(partial[0].tokens, context, partials, stream, next);
          } else {
            return;
          }
        }
    
      }
    
    } catch (err) {
      stream.emit('error', err);
    }
  }
}

function s(val) {
  return typeof val === 'undefined' ? '' : val.toString();
}

function escape(string) {
  return string.replace(/[&<>"]/g, escapeReplace);
}

function normalize(context, name, body) {
  var val = context[name];
  
  if (typeof(val) === 'function') {
    val = context[name](body);
  }
  
  return val;
}

function section(view, name, val, tokens, partials, stream, callback) {
  // var val = normalize(view, name, body);
  
  // if (typeof val === 'boolean') {
  //   return val ? render(tokens, view, partials, stream, callback) : callback();
  // }
  
  if (val instanceof Array) {
    var i = 0;
    
    for(var i = 0, valLen = val.length; i < valLen; i++){
      var item = val[i];
      
      var proto = insertProto(item, view);
      render(tokens, item, partials, stream, function () {
        proto.__proto__ = baseProto;
      });
    }
    
    return;
  }
  
  if (typeof val === 'object') {
    //view.push(val);
    var proto = insertProto(val, view);
    render(tokens, val, partials, stream, callback);
    proto.__proto__ = baseProto;
    //view.pop();
    return;
  }
  
  if (val) {
    return render(tokens, view, partials, stream, callback);
  }
  
  return callback();
}


//
//
//
function findInContext(context, key) {
  var i = context.length;
  while (i--) {
    if (context[i][key]) {
      return context[i][key];
    }
  }

  return undefined;
}


function insertProto(obj, newProto, replaceProto) {
  replaceProto = replaceProto || baseProto;
  var proto = obj.__proto__;
  while (proto !== replaceProto) {
    obj = proto;
    proto = proto.__proto__;
  }
  obj.__proto__ = newProto;
  return obj;
}



//
//
//
function escapeReplace(char) {
  switch (char) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '"': return '&quot;';
    default: return char;
  }
}
