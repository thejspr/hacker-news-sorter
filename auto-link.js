// Auto-link bare URLs in Hacker News comments. Vanilla JS, no dependencies.
// On item pages, walks text nodes under <body> and wraps http(s)://, www., and
// mailto: matches in <a target="_blank"> links.
(function () {
  var URL_RE = /(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+|mailto:[^\s<>"')]+)/gi;
  var TRAILING_RE = /[.,;:!?\]]+$/;
  var SKIP_TAGS = /^(A|BUTTON|TEXTAREA|SCRIPT|STYLE)$/;

  function linkifyTextNode(node) {
    var text = node.nodeValue;
    URL_RE.lastIndex = 0;
    if (!URL_RE.test(text)) {
      return;
    }
    URL_RE.lastIndex = 0;

    var fragment = document.createDocumentFragment();
    var lastIndex = 0;
    var match;
    while ((match = URL_RE.exec(text)) !== null) {
      var full = match[0];
      var start = match.index;

      if (start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, start))
        );
      }

      // Don't swallow trailing sentence punctuation into the link.
      var matched = full;
      var trailing = "";
      var trail = matched.match(TRAILING_RE);
      if (trail) {
        trailing = trail[0];
        matched = matched.slice(0, matched.length - trailing.length);
      }

      var a = document.createElement("a");
      a.href = /^www\./i.test(matched) ? "http://" + matched : matched;
      a.target = "_blank";
      a.style.textDecoration = "underline";
      a.textContent = matched;
      fragment.appendChild(a);

      if (trailing) {
        fragment.appendChild(document.createTextNode(trailing));
      }

      lastIndex = start + full.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode.replaceChild(fragment, node);
  }

  function walk(node) {
    var child = node.firstChild;
    while (child) {
      var next = child.nextSibling;
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue && /\S/.test(child.nodeValue)) {
          linkifyTextNode(child);
        }
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        !SKIP_TAGS.test(child.tagName)
      ) {
        walk(child);
      }
      child = next;
    }
  }

  function run() {
    if (window.location.href.indexOf("item?id=") > -1) {
      walk(document.body);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
