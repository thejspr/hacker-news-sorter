// move post element down
function moveDown(currentElement, nextElement) {
  var textElement = currentElement.prev("tr");
  currentElement.next("tr").remove();
  var next = nextElement;

  currentElement.insertAfter(next);
  textElement.insertAfter(next);

  textElement.before('<tr style="height: 5px"></tr>');
}

// initiate (bubble) sorting algorithm
function sort_entries() {
  var swapped;
  var count = $("td.subtext").length;

  do {
    var rows = $("td.subtext");
    swapped = false;

    for (var j = 0; j < rows.length - 1; j++) {
      var currentRow = $(rows[j]).parent();

      var nextRow = currentRow.next("tr").next("tr").next("tr");

      var currentRowPoints = parseInt(
        $("span", currentRow).text().trim().split(" ")[0]
      );
      var nextRowPoints = parseInt($("span", nextRow).text().trim().split(" ")[0]);

      if (isNaN(currentRowPoints)) {
        currentRowPoints = 0;
      }

      if (isNaN(nextRowPoints)) {
        nextRowPoints = 0;
      }

      if (currentRowPoints < nextRowPoints) {
        moveDown(currentRow, nextRow);
        swapped = true;
      }
    }
  } while (count--);

  $("#sorter").css("opacity", "0.4");
}

// build html for search bar
var search_html =
  '&nbsp;&nbsp;<input id="searchyc" size="30" type="text" placeholder="Search with hnsearch.com"></input>' +
  '<button id="searchyc-button">Search</input>';

$("span:first").append(search_html);
$("#searchyc,#searchyc-button").css("border", "0").css("padding", "0");

$("#searchyc-button").click(function () {
  var query = $("#searchyc").val();
  query = encodeURIComponent(query);
  window.location = "//hn.algolia.com/?q=" + query;
});

// search on "enter" button event
$("#searchyc").keyup(function (event) {
  if (event.keyCode == 13) {
    $("#searchyc-button").click();
  }
});

// build html for sort button
var sort_html =
  '<div id="sorter" style="position:absolute;float:left;color:#000;font-size:85%;"><button id="sort_btn">Sort</button><br />' +
  '<span style="vertical-align:middle;"><input type="checkbox" id="keep_sorted"></span>Auto</div>';

$(function(){
  $("body").prepend(sort_html);

  // onClick listener for sort button and stay-sorted checkbox
  $("#keep_sorted").click(function () {
    if ($(this).is(":checked")) {
      localStorage.keep_sorted = 1;
      sort_entries();
    } else {
      localStorage.keep_sorted = 0;
    }
  });

  $("#sort_btn").on('click', sort_entries);

  if (localStorage.keep_sorted == 1) {
    $("#keep_sorted").attr("checked", "checked");
    sort_entries();
  }
})
