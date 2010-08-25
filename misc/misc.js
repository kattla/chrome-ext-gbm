NodeList.prototype.forEach = function(fun) {
  for (var i=0, elem; elem = this[i]; i++) { fun(elem); }
}
Node.prototype.appendText = function(text) {
  this.appendChild(this.ownerDocument.createTextNode(text));
}
function createElem(name,attributes,parent) {
  var elem = document.createElement(name);
  for (var i in attributes) elem.setAttribute(i, attributes[i]);
  if (parent) parent.appendChild(elem);
  return elem;
}
Array.prototype.find = function(fun) {
  var i = 0, len = this.length >>> 0;
  if (typeof fun != "function")
    throw new TypeError();
  var thisp = arguments[1];
  for (; i < len; i++) {
    if (i in this && fun.call(thisp, this[i], i, this)) return this[i];
  }
  return null;
};

function compareBy(fun, reverse) {
  var sign = (reverse ? -1 : 1);
  return function(a,b) {
    if (fun(a)<fun(b)) return -sign; if (fun(a)>fun(b)) return sign; return 0;
  }
}
