function Autosuggest(input, alternatives) {

  function getSuggestions(userInput) {
    var ret = [];
    alternatives.forEach(function(alt) {
      var len = userInput.length;
      for (var i = 0; i+len <= alt.length; i++) {
        if ((alt[i-1]||" ").match(/\W/)) {
          var s = alt.substr(i,len);
          if (alt.length > len && s.toLowerCase() == userInput.toLowerCase()) {
            ret.push({ full: alt, prefix: alt.substr(0,i), match: s, postfix: alt.substr(i+len) });
          }
        }
      }
    });
    return ret;
  }
  
  var div = this.element = document.createElement('div');
  div.className = 'autosuggest';
  div.style.display = 'none';
  div.style.top = (input.element.offsetTop + input.element.offsetHeight) + "px";
  div.style.left = input.element.offsetLeft + "px";
  div.style.width = input.element.offsetWidth + "px";
  document.body.appendChild(div);
  var active = 0, oldValue = '';

  var update = this.update = function() {
    if (document.activeElement != input.element) { div.style.display = 'none'; return; }
    var txt = input.get().replace(/^\s+/,'');
    if (oldValue != txt) active = 0;
    oldValue = txt;
    if (!txt) { div.style.display = 'none'; return; }
    var sugg = getSuggestions(txt);
    div.style.display = 'block';
    div.innerHTML = '';
    sugg.forEach(function(x,i) {
      var div2 = document.createElement('div');
      if (i == active) div2.className = 'active';
      div2.appendChild(document.createTextNode(x.prefix));
      var span = document.createElement('span');
      span.innerText = x.match;
      div2.appendChild(span);
      div2.appendChild(document.createTextNode(x.postfix));
      div.appendChild(div2);
      div2.onmousedown = function(e) {
        e.preventDefault(); input.set(x.full); div.style.display = 'none';
      }
    });
  };

  input.element.onfocus = update;
  input.element.onblur = update;
  input.element.onkeyup = update;
  input.element.onkeydown = function(ev) {
    if (div.style.display == 'block') {
      switch (ev.keyCode) {
        case 9: input.set(div.childNodes[active].innerText); break; // Tab
        case 40: active++; break; // Down
        case 38: active--; break; // Up
        default: return;
      }
      ev.preventDefault();
      active = Math.max(0, Math.min(div.childNodes.length, active));
      update();
    }
  };

}

Autosuggest.Input = function(input) {
  this.element = input;
  this.get = function() { return input.value };
  this.set = function(x) { input.value = x; };
}
Autosuggest.SeparatedInput = function(input) {
  function getBefore() { return input.value.substr(0, input.selectionStart) }
  function getAfter() { return input.value.substr(input.selectionStart) }
  this.element = input;
  this.get = function() {
    return getBefore().split(",").pop() + getAfter().split(",")[0];
  };
  this.set = function(x) {
    var before = getBefore().replace(/[^,]*$/,"");
    var after = getAfter().replace(/^[^,]*/,"");
    if (before) before += " ";
    before += x;
    if (!after) before += ", ";
    input.value = before + after;
    input.selectionStart = input.selectionEnd = before.length;
  };
}
