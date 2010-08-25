var Protocol = new (function() {

var GURL = "https://www.google.com/bookmarks/";
var signature;

this.load = function(handle) {
  var xhr = new XMLHttpRequest();
  var url = GURL + "?output=rss&num=1000";
  xhr.open("GET", url, true);
  xhr.onload = function() {
    var bms = [];
    parseRSS(xhr.responseXML, function(bm) { bms.push(bm); });
    handle(bms);
  };
  xhr.send(null);
}

this.add = function(bm, cont) {
  // WARNING: bm is not a real Bookmark object
  var data = 'sig=' + signature + '&bkmk=' + bm.url + '&title=' + bm.title + '&labels=' + bm.labels + '&annotation=' + bm.annotation;
  var xhr = post(GURL+"mark");
  if (cont) xhr.onload = function() { cont(); };
  xhr.send(data);
}

this.remove = function(bm, cont) {
  var data = 'sig=' + signature + '&dlq=' + bm.id;
  var xhr = post(GURL+"mark");
  if (cont) xhr.onload = function() { cont(); };
  xhr.send(data);
}

function post(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  xhr.onload = function() { console.log("Protocol # post # onload " + xhr.statusText); };
  xhr.onerror = function() { console.log("Protocol # post # onerror " + xhr.statusText); };
  xhr.onabort = function() { console.log("Protocol # post # onabort " + xhr.statusText); };
  return xhr;
}

function parseRSS(rss, handle) {
  signature = rss.querySelector("signature").textContent;
  rss.querySelectorAll("item").forEach(function(elem) {
    function get(name) { var x = elem.querySelector(name); if (x) { return x.textContent; } else { return null; } }
    var bm = new Bookmark({
      title: get("bkmk_title"),
      url: get("link"),
      timestamp: Date.parse(get("pubDate")),
      id: get("bkmk_id"),
      annotation: get("bkmk_annotation")
    });
    elem.querySelectorAll("bkmk_label").forEach(function (elem) {
      bm.addLabel(new Label(elem.textContent));
    });
    handle(bm);
  });
}

})()
