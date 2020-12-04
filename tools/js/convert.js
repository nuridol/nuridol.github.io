
(function () {
    if (typeof jQuery == 'undefined') {
        return;
    }
    jQuery.noConflict();
    var $ = jQuery;

function convertYoutubeCode() {
    var code = $("#code").val().replace(/^\s+|\s+$/, "");
    var convertedCode = "";

    if  (code.match(/^<iframe width=/) && (code.match("www.youtube.com") || code.match("www.youtube-nocookie.com"))) {
        $('#testbox').css('display', 'none');

        $("#testbox").html(code);
        var width  = $("#testbox").find('iframe').attr('width');
        if (parseInt(width, 10) > 0) {
            width = parseInt(width, 10); //+ 'px';
        }
        else {
            width = "100%";
        }

        var height = $("#testbox").find('iframe').attr('height');
        if (parseInt(height, 10) > 0) {
            height = parseInt(height, 10); // + 'px';
        }
        else {
            height = "auto";
        }

        var fullScreen = "false";
        if (code.match("allowfullscreen")) {
            fullScreen = "true";
        }

        var videoSrc = $("#testbox").find('iframe').attr('src').replace("www.youtube.com/embed", "www.youtube.com/v");
        videoSrc = videoSrc.replace("www.youtube-nocookie.com/embed", "www.youtube-nocookie.com/v");

        if (videoSrc.match("\\?")) {
            videoSrc = videoSrc + "&version=3";
        }
        else {
            videoSrc = videoSrc + "?version=3";
            //remove tag: &hl=ko_KR
        }

        var convertedVideoCode = '<div><object width="' + width + '" height="' + height + '"><param name="movie" value="' + videoSrc + '"></param><param name="allowFullScreen" value="' + fullScreen + '"></param><param name="allowscriptaccess" value="always"></param><embed src="' + videoSrc + '" type="application/x-shockwave-flash" width="' + width + '" height="' + height + '" allowscriptaccess="always" allowfullscreen="' + fullScreen + '"></embed></object></div>';

        convertedCode = convertedVideoCode + '<p><a href="https://nuridol.net/ut_convert.html">NuRi\'s Tools - YouTube 변환기</a></p>';

        $("#testbox").html("");

        $('#resultbox').css('display', 'block');
    }

    $("#result").text(convertedCode);
    $("#result").removeAttr("disabled");
}


    $(document).ready(function () {
        if (!$('#code') || !$('#result') || !$('#convert')) {
            return;
        }

        $('#convert').click(function () {
            convertYoutubeCode();
        });
    });


})();

