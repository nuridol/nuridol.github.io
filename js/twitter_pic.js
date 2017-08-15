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
    $.ajax({
      url: "https://query.yahooapis.com/v1/public/yql?"+ "q=select%20src%20from%20html%20where%20url%3D%22"+ encodeURIComponent(url)+ "%22%20and%20compat=%22html5%22%20and%20xpath=%27//div[contains%28@class,%22AdaptiveMedia%22%29]/img%27&format=json",
      beforeSend: function(xhr){
        if (xhr.overrideMimeType)
        {
          xhr.overrideMimeType("application/json");
        }
      },
      dataType: 'json',
      async: true,
      cache: false
    })
    .success(function(data) {
      if (!data.query.results || !data.query.results.img) {
        $("#picList").html('<div class="alert alert-danger" role="alert">No data. Try later.</div>');
        return;
      }
      for (var index in data.query.results.img) {
        console.log(index);
        var src = index != "src" ? data.query.results.img[index].src : data.query.results.img[index];
        addImage(src);
      }
    })
    .error(function(e) { alert("error!" + e.statusText); return; });
  }

  function addImage(url) {
    if (!url || url.length == 0 || url.indexOf("twimg.com/") < 0 ) {
      return;
    }

    // console.log(url);
    var origSrc = url + ":orig";
    var downUrl = url.replace(/^.*\//, '');
    var element = '<div class="col-xs-6 col-md-3"><a href="' + origSrc + '" class="thumbnail" download="' + downUrl + '"><img src="'+ origSrc + '"></a></div>';
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

