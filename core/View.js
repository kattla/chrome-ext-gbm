function View() {

  this.bookmarks = [];
  this.labels = [];
  this.parent = null;
  this.tree = null;
  //this.unlabeled = [];

  this.filter = function(pred) {
    var view = new View();
    var oldView = view.parent = this;
    this.labels.forEach(function(l) { l.mark1 = false; l.mark2 = false; });
    view.bookmarks = this.bookmarks.filter(function(bm) {
      if (pred(bm)) {
        bm.labels.forEach(function(l) { l.mark1 = bm; });
        oldView.labels.forEach(function(l) { if (l.mark1 != bm) l.mark2 = view });
        return true;
      }
      else { return false }
    });
    view.labels = this.labels.filter(function(l) { return l.mark1 && l.mark2 });
    /*view.unlabeled = view.bookmarks.filter(function(bm) {
      return ! bm.labels.some(function(l) { return l.mark1 && l.mark2 == view })
    });*/
    return view;
  }

  this.filterIn = function(labelish) {
    return this.filter(function(bm) { return labelish.hasBookmark(bm) });
  }
  this.filterOut = function(labelish) {
    return this.filter(function(bm) { return ! labelish.hasBookmark(bm) });
  }

}
