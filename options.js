var Options = new function() {

var defaults = {
  'favicon': true,
  'bookmark-sort-direction': 'descending',
  'bookmark-sort-by': 'date',
  'label-group-by': 'prefix',
  'label-group-separator': ':',
}

var get = this.get = function(name) {
  try { if (localStorage[name]) return JSON.parse(localStorage[name]); }
  catch (err) { }
  return defaults[name];
}
var set = this.set = function(name,value) { localStorage[name] = JSON.stringify(value); }

for (var i in defaults) {
  (function(name) { // Because i mutates
    this.__defineGetter__(name, function() { return get(name) });
    this.__defineSetter__(name, function(x) { set(name,x); });
  }).call(this,i)
}

this.restoreDefaults = function() { for (var i in defaults) localStorage.removeItem(i); }

}()
