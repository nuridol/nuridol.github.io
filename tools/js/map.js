
(function () {
    if (typeof jQuery == 'undefined') {
        return;
    }
    jQuery.noConflict();
    var $ = jQuery;

      function encodeMapCode() {
        var code = $("#code").val().replace(/\n/g, "");
        code = code.replace(/^\s+|\s+$/, "");

        var convertedCode = "";
        if  (code.match(/^<iframe/)) {
          $("#testbox").html(code);
          var width  = $("#testbox").find('iframe:first').attr('width');
          if (parseInt(width, 10) > 0) {
              width = parseInt(width, 10);
          }
          else {
              width = "100%";
          }

          var height = $("#testbox").find('iframe:first').attr('height');
          if (parseInt(height, 10) > 0) {
              height = parseInt(height, 10);
          }
          else {
              height = "auto";
          }

          var extraCode = code.replace(/<iframe.*<\/iframe>/, "");

          var extraAttrs = "";
          var attrs = $("#testbox").find('iframe:first')[0].attributes;
          for(var i=0;i<attrs.length;i++) {
            if (attrs[i].nodeName == "src" || attrs[i].nodeName == "width" || attrs[i].nodeName == "height") {
              continue;
            }
            extraAttrs = extraAttrs + " " + attrs[i].nodeName;
            if (attrs[i].nodeValue != "") {
              extraAttrs = extraAttrs + '="' + attrs[i].nodeValue + '"';
            }
          }

          var iframeSrc = $("#testbox").find('iframe:first').attr('src');
          convertedCode = '<div><object width="' + width + '" height="' + height + '" data="' + iframeSrc + '" type="text/html" ' + extraAttrs + '></object></div>';
          convertedCode = convertedCode + '<div>' + extraCode + '</div><p><a href="https://nuridol.net/mapconvert.html">NuRi\'s Tools - Google Maps 변환기</a></p>';
        }
        $("#result").text(convertedCode);
        $("#result").removeAttr("disabled");
      }

      $(document).ready(function () {
        if (!$('#code') || !$('#result') || !$('#convert')) {
            return;
        }

        $('#convert').click(function () {
            encodeMapCode();
        });
      });

})();

