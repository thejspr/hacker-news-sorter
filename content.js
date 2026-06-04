// Hacker News Sorter — sorts front-page posts by points, plus an Algolia search box.
// Vanilla JS, no dependencies.

// Collect each story as a group of rows. On HN a story is three consecutive rows:
//   tr.athing (title) -> tr containing td.subtext (score/comments) -> tr.spacer
function collectPosts() {
  var groups = [];
  document.querySelectorAll(".athing").forEach(function (athing) {
    // A sortable story is followed by a row containing td.subtext (its score /
    // comments line). Comment rows (.athing.comtr) and other .athing elements have
    // no such sibling, so they're skipped — otherwise they'd be torn out of their
    // own table and reordered (e.g. on comment, /threads and /newcomments pages).
    var subtext = athing.nextElementSibling;
    if (!subtext || !subtext.querySelector("td.subtext")) {
      return;
    }

    var rows = [athing, subtext];
    var score = 0;
    var scoreEl = subtext.querySelector(".score");
    if (scoreEl) {
      score = parseInt(scoreEl.textContent.trim(), 10) || 0;
    }
    var spacer = subtext.nextElementSibling;
    if (spacer && spacer.classList.contains("spacer")) {
      rows.push(spacer);
    }
    groups.push({ rows: rows, score: score });
  });
  return groups;
}

// Sort posts by points (descending) with a single DOM write.
function sort_entries() {
  var groups = collectPosts();
  if (groups.length < 2) {
    return; // nothing to sort (e.g. the lone story on a comment page)
  }

  // Anchor: the first trailing row (the "More" / morespace row) that is not part of
  // any group. Capture it before we start moving nodes around.
  var lastGroup = groups[groups.length - 1];
  var lastRow = lastGroup.rows[lastGroup.rows.length - 1];
  var anchor = lastRow.nextElementSibling;
  var parent = groups[0].rows[0].parentNode;

  // Array.prototype.sort is stable (ES2019+), so equal scores keep page order.
  groups.sort(function (a, b) {
    return b.score - a.score;
  });

  // Move the rows into a fragment in sorted order, then re-insert in one operation.
  var fragment = document.createDocumentFragment();
  groups.forEach(function (g) {
    g.rows.forEach(function (row) {
      fragment.appendChild(row);
    });
  });
  parent.insertBefore(fragment, anchor);

  var sorter = document.getElementById("sorter");
  if (sorter) {
    sorter.style.opacity = "0.4";
  }
}

// Add the hnsearch/Algolia search box to the first header span.
function setupSearch() {
  var firstSpan = document.querySelector("span");
  if (!firstSpan) {
    return;
  }

  var input = document.createElement("input");
  input.id = "searchyc";
  input.size = 30;
  input.type = "text";
  input.placeholder = "Search with hnsearch.com";
  input.style.border = "0";
  input.style.padding = "0";

  var button = document.createElement("button");
  button.id = "searchyc-button";
  button.textContent = "Search";
  button.style.border = "0";
  button.style.padding = "0";

  firstSpan.append("  ", input, button);

  function doSearch() {
    window.location = "//hn.algolia.com/?q=" + encodeURIComponent(input.value);
  }

  button.addEventListener("click", doSearch);
  input.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      doSearch();
    }
  });
}

// Add the Sort button and the "Auto" keep-sorted checkbox.
function setupSorter() {
  var sorter = document.createElement("div");
  sorter.id = "sorter";
  sorter.style.cssText =
    "position:absolute;float:left;color:#000;font-size:85%;";
  sorter.innerHTML =
    '<button id="sort_btn">Sort</button><br />' +
    '<span style="vertical-align:middle;"><input type="checkbox" id="keep_sorted"></span>Auto';
  document.body.prepend(sorter);

  var keepSorted = document.getElementById("keep_sorted");
  var sortBtn = document.getElementById("sort_btn");

  keepSorted.addEventListener("click", function () {
    if (keepSorted.checked) {
      localStorage.keep_sorted = 1;
      sort_entries();
    } else {
      localStorage.keep_sorted = 0;
    }
  });

  sortBtn.addEventListener("click", sort_entries);

  if (localStorage.keep_sorted == 1) {
    keepSorted.checked = true;
    sort_entries();
  }
}

function init() {
  setupSearch();
  setupSorter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
