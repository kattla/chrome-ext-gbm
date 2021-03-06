var Protocol = new (function() {

var GURL = "https://www.google.com/bookmarks/";
var signature;
var statusOK = false;

var enc = encodeURIComponent;

this.isOK = function() { return statusOK }

var load = this.load = function(callback,start) {
  var url = GURL + "?output=rss&num=1000" + (start ? ("&start=" + start ) : "");
  var xhr = newXHR('GET', url, function(isOK) {
    var count = 0;
    if (isOK) parseRSS(xhr.responseXML, function() { count++; });
    if (count>=1000) load(callback, (start||0) + 1000);
    else if (callback) callback(isOK);
  });
  xhr.send(null);
}

this.search = function(query, callback) {
  var url = GURL + "find?output=rss&num=1000&q=" + enc(query);
  var xhr = newXHR('GET', url, function(isOK) {
    var res = [];
    if (isOK) parseRSS(xhr.responseXML, function(bm) { res.push(bm); });
    callback(res);
  });
  xhr.send(null);
}

this.add = function(bm, callback) {
  // WARNING: bm is not a real Bookmark object
  needSignature(function() {
    var data = "sig=" + enc(signature) + "&bkmk=" + enc(bm.url) + "&title=" + enc(bm.title) + "&labels=" + enc(bm.labels) + "&annotation=" + enc(bm.annotation);
    newXHR('POST', GURL+"mark", callback).send(data);
  });
}

this.remove = function(bm, callback) {
  needSignature(function() {
    var data = 'sig=' + enc(signature) + '&dlq=' + enc(bm.id);
    newXHR('POST', GURL+"mark", callback).send(data);
  });
}

function newXHR(method, url, callback) {
  var xhr = new XMLHttpRequest();
  var timeout = window.setTimeout(function() { xhr.abort(); }, 2000);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      window.clearTimeout(timeout);
      if (xhr.status == 200) {
        statusOK = true;
        if (callback) callback(true);
      }
      else {
        statusOK = false;
        if (callback) callback(false);
      }
    }
  };
  xhr.open(method, url, true);
  if (method == 'POST')
    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  return xhr;
}

function needSignature(callback) {
  if (signature) callback(); else {
    var xhr = newXHR('GET', GURL + "?output=rss", function(isOK) {
      if (isOK) signature = xhr.responseXML.querySelector("signature").textContent;
      if (!signature) throw new Error("Cannot get signature");
      callback();
    });
  }
}

function parseRSS(rss, callback) {
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
    if (callback) callback(bm);
  });
}

})()
