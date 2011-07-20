module.exports = new TagManager();

function TagManager() {

  var taglist = [];

  this.addTag = function (tag) {
    taglist.push(tag);
  }

  this.setTagList = function (tags) {
    taglist = tags
  }

  /** 
   * [TBD] This code sucks big time... 
   * I need to organize tags more efficiently to get rid of this ugly and buggy piece of code. 
   * 
   * Todos: 
   * - find best match, selectors with predicated must be ranked higher
   * - more than one module my map to a single element
   */
  this.getTag = function (elem, attrs, prefix, uri, namespaces) {
    //console.log(JSON.stringify(arguments));
    for (var i = 0, tag = null; i < taglist.length; i++) {
      tag = taglist[i];
      if (uri !== null && tag.namespace != '' && tag.namespace != uri) {
        //console.log('tag has namespace, but no match'); 
        continue;
      }

      var si = tag.selector.indexOf('[');
      if (si !== -1) {
        var tagelem = tag.selector.substring(0, si),
            preds = {},
            ps, 
            attrh = {};
        ps = tag.selector.substring(si).split(']').forEach(function (val) {
          if (val === '') return;
          preds[val.substring(1, val.indexOf('='))] = val.substring(val.indexOf('=') + 1);
        });
        for (var j = 0; j < attrs.length; j++) {
          attrh[attrs[j][0]] = attrs[j][1];
        }
      } else {
        var tagelem = tag.selector;
      }

      var fe = true;
      if (tagelem !== elem && tagelem !== '*') {
        //console.log('element name not matched');
        fe = false;
        continue;
      }

      var fp = true
      if (si !== -1) {
        var count = 0;
        for (pred in preds) {
          //console.log('pred ' + pred + ". " + attrh[pred] + "," + preds[pred]);
          if (attrh[pred] !== preds[pred]) {
            fp = false;
            //console.log('attribute val not mached');
            break;
          }
          count++;
        }
        if (count -1 >= j) {
          fp = false;
          //console.log('matched not all predicates');  
          break;
        }
      }

      if (!fp) {
        //console.log('attrs not matched');
        continue;
      }
      if (!fe) {
        //console.log('selector not matched');
        continue;
      }

      //console.log('matching tag ' + tag.selector);
      return tag;
    }

    return null;
  }
}