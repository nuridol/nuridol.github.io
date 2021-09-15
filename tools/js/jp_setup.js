$(function() {
    var itemType = "";
    function setupItemType() {
        if (!$('#options').length) {
            console.log("no input");
            return;
        }
        // check url parameter
        var currentUrl = window.location.href;
        var urlMatch = currentUrl.match(/html#([0-9a-z]*)/);
        var type = "iphone13pro";
        if (urlMatch && urlMatch.length > 0) {
            type = urlMatch[1];
        }
        var optionId = '#option_' + type;
        if ($(optionId)) {
            $(optionId).prop('class', 'btn btn-success active');
            // $(optionId).button('toggle');
            itemType = type;
        }
        $("#options a").click(function () {
            setTimeout("location.reload(true);", 2);
        });
        // load model list
        let script1 = document.createElement('script');
        script1.src = "js/jp_" + itemType + ".js";
        let script2 = document.createElement('script');
        script2.src = "js/jp_stocks.js";
        document.body.append(script1);
        document.body.append(script2);
    }

    setupItemType();
});
