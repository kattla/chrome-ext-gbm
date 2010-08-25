var BG = chrome.extension.getBackgroundPage();
var BM = null;
var selectedTab = null;
var template = { };

window.onload = function() {
  chrome.tabs.getSelected(null, function (tab) {
    selectedTab = tab;
    BM = BG.Bookmark.find(function(bm) { return bm.url == tab.url });
    document.querySelector("div#addedit > a").innerText = (BM?'Edit bookmark':'Add bookmark');
    if (BG.Bookmark.all.length == 0) addEdit();
  });
  document.querySelectorAll("div#templates > *").forEach(function(tmpl) {
    template[tmpl.className] = tmpl;
  });
  if (!Options.favicon) template.bm.querySelector('img').style.display = 'none';
  var view = new View();
  view.bookmarks = BG.Bookmark.all.slice(); view.labels = BG.Label.all.slice();
  var bmField = {
    'date': function(x) { return x.timestamp },
    'title': function(x) { return x.title.toLowerCase() },
  }
  view.labels.sort(compareBy(function(x) { return x.name.toLowerCase() }));
  var dir = Options['bookmark-sort-direction'], by = Options['bookmark-sort-by'];
  view.bookmarks.sort(compareBy(bmField[by], (dir=="descending")));
  showView(view);
}

function addEdit(bm) {
  bm = bm || BM || { url:selectedTab.url, title:selectedTab.title, labels:[] };
  document.body.innerHTML = '';
  var iframe = document.createElement('iframe');
  iframe.style.border = 'none';
  iframe.onload = function() {
    iframe.contentWindow.setBM(bm);
    var height = iframe.contentWindow.document.height + "px";
    iframe.style.height = height;
    document.body.style.background = "#eeeeee"; // This should not be visable. It is though.
    //document.body.style.height = height;
    //document.querySelector('html').style.height = height;
  };
  iframe.src = "addedit.html";
  document.body.appendChild(iframe);
}

function filterView(view,labelish,isPositive) {
  var old = view;
  var className;
  if (isPositive) { view = view.filterIn(labelish); className = "positive" }
  else { view = view.filterOut(labelish); className = "negative" }
  var selector = document.querySelector('div#selector');
  function append(elem) { selector.appendChild(a); }
  function save(a,view) {
    var children = [];
    selector.childNodes.forEach(function(e) { children.push(e) });
    a.onclick = function() {
      selector.innerHTML = '';
      children.forEach(function(e) { selector.appendChild(e) });
      showView(view);
    };
  }
  if (selector.innerHTML == '') {
    var a = createElem('a',{href:"#",class:'clear'}); a.innerText = "all";
    save(a,old);
    append(a);
  }
  var a = createElem('a',{href:"#",class:className}); a.innerText = labelish.name;
  append(a);
  save(a,view);
  showView(view);
}

function createLabelButtons(container,view,labelish) {
  var div = createElem('div',{class:'label-buttons'},container);
  var no = createElem('a',{class:'no'},div);
  var yes = createElem('a',{class:'yes'},div);
  no.onclick = function(e) { e.stopPropagation(); filterView(view, labelish, false); };
  yes.onclick = function(e) { e.stopPropagation(); filterView(view, labelish, true); };
  //container.onclick = function() { filterView(view, labelish, true); };
  container.oncontextmenu = function() { filterView(view, labelish, false); };
}

function createLabel(lbl,container,view,level) {
  var a = createElem('a',{href:"#",class:'label'},container);
  if (lbl == BG.noLabel) a.className = 'unlabeled';
  for (var i=0; i<level; i++) createElem('span',{class:'indent'},a);
  a.appendText(lbl.contextualName);
  createLabelButtons(a,view,lbl);
  a.onclick = function() { filterView(view, lbl, true); };
}

function createSubTree(tree,container,view,level) {
  var a = createElem('a',{href:"#",class:'group'},container);
  for (var i=0; i<level; i++) createElem('span',{class:'indent'},a);
  a.appendText(tree.contextualName); createElem('span',{class:'ellipses'},a).innerText = "...";
  createLabelButtons(a,view,tree);
  var b = createElem('div',{class:'labels'},container)
  b.style.display = 'none';
  createTree(tree,b,view,level+1);
  a.onclick = function() { if (b.style.display == 'none') b.style.display = 'block'; else b.style.display = 'none'; };
}

function createTree(tree,container,view,level) {
  tree.children.forEach(function(node) {
    if (node.children) createSubTree(node,container,view,level);
    else createLabel(node,container,view,level);
  });
}

function createBM(bm,container) {
  var tmp, div = template.bm.cloneNode(true);
  container.appendChild(div);
  div.oncontextmenu = function() { addEdit(bm); };
  div.querySelector("img").src = "chrome://favicon/"+bm.url;
  tmp = div.querySelector(".title a"); tmp.href = bm.url; tmp.innerText = bm.title;
  div.querySelector(".url").innerText = bm.url;
  tmp = div.querySelector(".bm-labels");
  bm.labels.forEach(function(lbl) {
    if (lbl!=BG.noLabel) createElem('div',{class:'bm-label'},tmp).innerText = lbl.name;
  });
  div.querySelector(".annotation").innerText = bm.annotation;
}

function setBMsHeight() {
  var bmArea = document.querySelector('div#bookmark-area');
  bmArea.style.height = (document.body.offsetHeight - bmArea.offsetTop) + "px";
}

function showView(view) {
  if (showView.interval) window.clearInterval(showView.interval);
  var cont1 = document.querySelector('div#label-area');
  var cont2 = document.querySelector('div#bookmark-area');
  cont1.innerHTML = ''; cont2.innerHTML = '';
  if (!view.tree) {
    view.tree = new LabelTree(view.labels);
    if (!view.parent && BG.noLabel.bookmarks.length) view.tree.children.push(BG.noLabel);
  }
  createTree(view.tree,cont1,view,0);
  setBMsHeight();
  // We don't want a huge number of bookmarks to make the UI unresponsive -
  // so we'll add them a few at a time.
  // The first loop is to avoid "blink" as intervals come with a minimal delay.
  var i = 0;
  for (var j = 0; j < 25 && i < view.bookmarks.length; j++)
    { createBM(view.bookmarks[i],cont2); i++ }
  showView.interval = window.setInterval(function() {
    for (var j = 0; j < 25 && i < view.bookmarks.length; j++)
      { createBM(view.bookmarks[i],cont2); i++ }
    if (i >= view.bookmarks.length) window.clearInterval(showView.interval);
  },0);
}

function toggleLabels() {
  var labels = document.querySelector('div#label-area');
  var toggle = document.querySelector('div#label-toggle');
  if (labels.style.display == 'none') {
    labels.style.display = 'block';
    toggle.className = '';
  } else {
    labels.style.display = 'none';
    toggle.className = 'reverse';
  }
  setBMsHeight();
}
