function Bookmark(args) {
  if (!args.id) throw new Error("Missing bookmark id");
  var self = Bookmark.ids[args.id] || this;
  self.title = args.title || "";
  self.url = args.url || "";
  self.timestamp = args.timestamp || 0;
  self.annotation = args.annotation;
  if (self == this) {
    this.id = args.id;
    Bookmark.all.push(this);
    var labels = [];
    this.__defineGetter__("labels", function() { return labels });
    Bookmark.ids[this.id] = this;
    Bookmark.unlabeled[this.id] = this;
  }
  return self;
}

function Label(name) {
  if (Label.names[name]) return Label.names[name];
  Label.all.push(this); Label.names[name] = this;
  this.name = name;
  var bookmarks = [];
  this.__defineGetter__("bookmarks", function() { return bookmarks })
  var contextualName;
  this.__defineGetter__("contextualName", function() { return contextualName || this.name });
  this.__defineSetter__("contextualName", function(cn) { contextualName = cn; });
  this.toString = function() { return this.name }
}

function resetState() {
  Bookmark.all = [];
  Bookmark.ids = {};
  Bookmark.unlabeled = {};
  Label.all = [];
  Label.names = {};
}
resetState();

Bookmark.prototype.addLabel = function(label) {
  if (this.labels.length == 0) delete Bookmark.unlabeled[this.id];
  if (this.labels.indexOf(label) == -1) {
    this.labels.push(label);
    label.bookmarks.push(this);
  }
}
Label.prototype.addBookmark = function(bm) { bm.addLabel(this); }

// Special label :)
var noLabel = { __proto__: new Label('unlabeled') };
noLabel.__defineGetter__("bookmarks", function() {
  var ret = [];
  for (var i in Bookmark.unlabeled) ret.push(Bookmark.unlabeled[i]);
  return ret;
});

Bookmark.prototype.hasLabel = function(label) {
  if (label == noLabel) return this.labels.length == 0;
  return this.labels.some(function(l) { return (l==label); });
}

Label.prototype.hasBookmark = function(bm) { return bm.hasLabel(this); }

Bookmark.find = function(pred) { return Bookmark.all.find(pred) }
