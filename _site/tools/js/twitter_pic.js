$(function () {

  function getPicData() {
    var url = $('#link').val();
    if (url.length == 0 || (url.indexOf("//twitter.com/") < 0 && url.indexOf("//mobile.twitter.com/") < 0)) {
      $("#picList").html('<div class="alert alert-warning" role="alert">URL is wrong.</div>');
      return;
    }
    // remove mobile
    url = url.replace("//mobile.twitter.", "//twitter.");

    // get json data
    encodedStr = encodeURIComponent("select * from htmlstring where url=\"" + url + "\" and xpath='//div[contains(@class,\"AdaptiveMedia\")]/img | //div[contains(@class,\"media\")]/img'");

    $.getJSON(
      "https://query.yahooapis.com/v1/public/yql?q="+ encodedStr + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=", function(data) {
      if (!data.query.results || !data.query.results.result) {
        $("#picList").html('<div class="alert alert-danger" role="alert">No data. Try later.</div>');
        return;
      }
      var $tempHtml = $("<div>" + data.query.results.result + "</div>").find("img").each(function(i, elem) {
      	//console.log($(elem));
        addImage($(elem).prop("src"));
      });
    })
    .fail(function(e) { alert("error!" + e.statusText); return; });
  }

  function addImage(url) {
    if (!url || url.length == 0 || url.indexOf("twimg.com/") < 0 ) {
      return;
    }

    url = url.replace(/:\w*$/, '');
    //console.log(url);
    var origSrc = url + ":orig";
    var downUrl = url.replace(/^.*\/|\.\w*$/g, '');

    var element = '<div class="col-xs-6 col-md-3"><a href="' + origSrc + '" download="' + downUrl + '"><img src="'+ origSrc + '" class="img-thumbnail"></a></div>';
    $('#picList').append(element);
  }

  // start
  $("#search").click(function() {
    $("#picList").html("");
    getPicData();
  });
  
    $("#clear").click(function() {
      $("#link").val("");
      return false;
  });
});

