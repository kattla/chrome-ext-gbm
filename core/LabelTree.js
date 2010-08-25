function LabelTree(labels,isSplit) {

  this.contextualName = "";
  var children = this.children = [];
  var parent = this.parent = null;

  this.__defineGetter__("name", function() {
    return (parent ? parent.name : "") + this.contextualName
  });

  init( isSplit ? labels : split(labels) );

  this.hasBookmark = function(bm) {
    return children.some(function (child) { return child.hasBookmark(bm); });
  }

  function splitKind(kind) {
    if (kind=='prefix') return function(str) { return str.match(/\W+|\w+\W*/g) }
    var separator = Options['label-group-separator'];
    if (kind=='separator') return function(str) {
      var l = str.split(separator);
      for (var i=0; i<l.length-1; i++) l[i] += separator;
      return l;
    }
    if (kind!='no') console.warn("Unrecognized label group kind: " + kind);
    return function(str) { return [str] }
  }
  function split(labels) {
    labels.sort(compareBy(function(l) { return l.name }));
    var f = splitKind(Options['label-group-by']);
    return labels.map(function(l) { return { lbl: l, tkns: f(l.name) } })
  }

  function init(arr) {
    var cur;
    var myself = this;
    while (cur = arr.shift()) {
      var tkn = cur.tkns.shift(), sub = [cur];
      while (cur.tkns.length && arr[0] && arr[0].tkns[0] == tkn)
        { arr[0].tkns.shift(); sub.push(arr.shift()); }
      if (sub.length==1) {
        cur.lbl.contextualName = cur.tkns.reduce(function(a,b) { return a + b }, tkn);
        children.push(cur.lbl);
      } else {
        var tree = new LabelTree(sub,true);
        if (tree.children == 1) {
          tkn += tree.children[0].contextualName;
          tree = tree.children[0];
        }
        tree.parent = myself;
        tree.contextualName = tkn;
        children.push(tree);
      }
    }
    children.sort(compareBy(function(x) { return x.contextualName.toLowerCase() }));
  }

}
