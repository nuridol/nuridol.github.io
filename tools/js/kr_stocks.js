$(function() {
    var APPLE_STORE_URL = 'https://www.apple.com/kr/shop/retail/pickup-message?pl=true&searchNearby=true&store=';
    var shopList = {};

    function getModelListUrl() {
        var url = "";
        var i = 0;
        for (var key in MODEL_LIST) {
            url = url + "&parts." + i + "=" + key;
            i++;
        }
        return url;
    }

    function aggregateData(data) {
        var stockData = {"stores": {}};
        if (!data.body || !data.body.stores) {
            // throw new Error("No data. Try later.");
            return stockData;
        }
        var stores = data.body["stores"];
        if (!stores) {
            // throw new Error("No data. Try later.");
            return stockData;
        }
        for (var index in stores) {
            var store = stores[index];
            var storeCode = store["storeNumber"];
            shopList[storeCode] = store["storeName"];
            if (!stockData["stores"]) {
                stockData["stores"] = {};
            }
            if (!stockData["stores"][storeCode]) {
                stockData["stores"][storeCode] = {};
            }
            for (var modelId in store["partsAvailability"]) {
                var flag = store["partsAvailability"][modelId]["pickupDisplay"] == "available" ? "true" : "false";
                stockData["stores"][storeCode][modelId] = {
                    "availability": {
                        "contract": flag,
                        "unlocked": flag
                    }
                };
            }
        }
        //rawData[startCode] = stockData;
        return stockData;
    }

    function getStoreList() {
        var url = "https://www.apple.com/rsp-web/store-search?locale=ko_KR";
        // get json data
        //cors_url = 'https://api.allorigins.win/get?url=';
        cors_url = 'https://polished-disk-d743.nuridol.workers.dev/?';
        //cors_url = 'https://cors-proxy.htmldriven.com/?url=';
        //cors_url = 'https://yacdn.org/proxy/';
        // encodeURIComponent(
        return $.ajax({
            url: cors_url + url,
            //url: url,
            beforeSend: function(xhr) {
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("application/json");
                }
            },
            dataType: 'json',
            async: true,
            cache: false
        });
    }

    function getPickupData(startCode) {
        var url = APPLE_STORE_URL + startCode + getModelListUrl();
        // get json data
        //cors_url = 'https://api.allorigins.win/get?url=';
        cors_url = 'https://polished-disk-d743.nuridol.workers.dev/?';
        //cors_url = 'https://cors-proxy.htmldriven.com/?url=';
        //cors_url = 'https://yacdn.org/proxy/';
        // encodeURIComponent(
        return $.ajax({
            url: cors_url + url,
            //url: url,
            beforeSend: function(xhr) {
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("application/json");
                }
            },
            dataType: 'json',
            async: true,
            cache: false
        });
    }

    function getStoreData() {
        var stockData = {
            "updated": (new Date).getTime()
        };
        // R692/name: 가로수길
        // https://www.apple.com/today-bff/stores
        $.when(
            getPickupData('R692'),
            getPickupData('R747')
        ).then(function(data1, data2) {
            // All is ready now, so...
            const d1 = aggregateData(data1[0]);
            const d2 = aggregateData(data2[0]);
            stockData["stores"] = Object.assign({}, d1.stores, d2.stores);
            if (stockData["stores"].length < 1) {
                throw new Error("No data. Try later.");
            }
            drawWatchList();
            clearTable();
            drawTable(stockData);
            checkStockData(stockData);
        }).catch(function(e) {
            console.log(e);
            $("#time").html(e.message);
        });
        return;
    }

    function unixdateformat(str) {
        var objDate = new Date(str);
        var nowDate = new Date();
        myHour = Math.floor((nowDate.getTime() - objDate.getTime()) / (1000 * 60 * 60)) + 1;

        var year = objDate.getFullYear();
        var month = objDate.getMonth() + 1;
        var date = objDate.getDate();
        var hours = objDate.getHours();
        var minutes = objDate.getMinutes();
        var seconds = objDate.getSeconds();
        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        str = year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
        var rtnValue = str;

        return rtnValue;
    }

    function removeWatch(id) {
        $('#' + id).remove();
        var text = $("#watchData").val();
        var filter = new RegExp(",*" + id, "g");
        text = text.replace(filter, '');
        $("#watchData").val(text);
    }

    function drawWatchList() {
        $("#watchList").html("");

        var checkList = $("#watchData").val().split(",");
        for (var i in checkList) {
            var item = checkList[i];
            if (item == "") continue;
            var codes = item.split('-');
            var shopCode = codes[0];
            var internalModelCode = codes[1];
            var modelCode = internalModelCode.replace('_', '/');
            var id = shopCode + "-" + internalModelCode;
            var name = shopList[shopCode] + " " + MODEL_LIST[modelCode];
            $("#watchList").append('<span id="' + id + '" class="badge badge-primary" style="display:inline-block;margin-right:5px;">' + name + '</span>');
        }

        if ($("#watchData").val().length > 0) {
            toggleWatchButton(true);
        } else {
            toggleWatchButton(false);
        }
    }

    function toggleWatch(element) {
        var shopCode = $("#table > thead > tr > th:eq(" + $(element).index() + ")").attr('data-shopcode');
        //var shopName = $("#table > thead > tr > th:eq(" + $(element).index() + ")").text();

        var modelCode = $(element).closest("tr").find('th:eq(0)').attr('data-modelcode');
        //var modeName = $(element).closest("tr").find('th:eq(0)').text();

        // to prevent jquery error
        var internalModelCode = modelCode.replace("/", "_");
        var id = shopCode + "-" + internalModelCode;
        if ($('#' + id).length > 0) {
            removeWatch(id);
        } else {
            removeWatch(id);
            // add
            var text = $("#watchData").val();
            var filter = new RegExp(id + ",*");
            text = text.length > 0 ? text + "," : text;
            text = text + id;
            $("#watchData").val(text);
        }

        drawWatchList();
    }

    function checkStockData(data) {
        if (!$("#watchButton").hasClass("active")) {
            return;
        }

        var timeText = $("#lastCheck").val();
        if (timeText == $('#time').text()) {
            // nothing
            return;
        }

        // set new value
        $("#lastCheck").val($('#time').text());

        var checkList = $("#watchData").val().split(",");

        var foundFlag = false;

        for (var i in checkList) {
            var item = checkList[i];
            var codes = item.split('-');
            var shopCode = codes[0];
            var internalModelCode = codes[1];
            modelCode = internalModelCode.replace("_", "/");

            console.log(data["stores"][shopCode]);
            console.log(modelCode);
            var flag = data["stores"][shopCode][modelCode]["availability"]["contract"];
            if (flag != "true") {
                flag = data["stores"][shopCode][modelCode]["availability"]["unlocked"];
            }
            if (flag == "true") {

                var log = $('#time').text() + " [" + shopList[shopCode] + " " + MODEL_LIST[modelCode] + "] is in stock\n";
                $("#logtext").html($("#logtext").html() + log);
                var psconsole = $('#logtext');
                psconsole.scrollTop(
                    psconsole[0].scrollHeight - psconsole.height()
                );
                foundFlag = true;
            } else {
                // console.log('false');
            }
        }

        if (foundFlag && $("#audiocheck").prop('checked')) {
            var audio = new Audio('sound.mp3');
            audio.play();
        }
    }

    function watchStock() {
        // get new data
        getStoreData();

        // repeat
        var timer = setTimeout(function() { watchStock(); }, 15000);
    }

    function toggleWatchButton(flag) {
        if (flag) {
            // on
            if ($("#watchButton").length == 0) {
                $("#refresh").after('<button type="button" class="btn btn-danger" id="watchButton" style="margin:5px;"><span class="fa fa-repeat"></span> WATCH</button><label><input type="checkbox" id="audiocheck"> Audio</label>');
                $("#watchButton").click(function() {
                    if (!$("#watchButton").hasClass("active")) {
                        $("#watchButton").addClass("active");
                        $("#watchButton").removeClass("btn-danger");
                        $("#watchButton").addClass("btn-info");
                        watchStock();
                    }
                });
            }
        } else {
            // off
            $("#watchButton").next("label").remove();
            $("#watchButton").remove();
        }
    }

    function clearTable() {
        $("#table thead").html("");
        $("#table tbody").html("");
    }

    function drawTable(data) {
        // date
        var date = new Date(parseInt(data["updated"], 10));
        $("#time").html(unixdateformat(date));
        $("#table thead").append('<tr></tr>');
        $("#table thead tr").append('<th class="text-left">type</th>');
        var trs = {};

        Object.keys(shopList).map(function(shopCode) {
            $("#table thead tr").append('<th class="shop-column" data-shopcode="' + shopCode + '">' + shopList[shopCode] + '</th>');
            var stockInfo = data["stores"][shopCode];
            for (var model in MODEL_LIST) {
                if (!trs[model]) {
                    trs[model] = new Array();
                    trs[model].push('<th class="text-left" data-modelcode="' + model + '">' + MODEL_LIST[model] + '</th>');
                }
                var check = stockInfo[model];
                if (!check) {
                    check = stockInfo[model.replace("/", "_")];
                }
                if (check && (check["availability"]["contract"] == "true" || check["availability"]["unlocked"] == "true")) {
                    trs[model].push('<td class="table-success shop-column"><span class="fa fa-check"></span></td>');
                } else {
                    trs[model].push('<td class="shop-column text-secondary"><span class="fa fa-times fa-sm"></span></td>');
                }
            }
        });

        for (var key in trs) {
            $("#table tbody").append('<tr>' + trs[key].join("") + '</tr>');
        }
        // add event
        $("#table > tbody > tr > td").click(function() {
            toggleWatch(this);
        });
    }

    // start
    $("#refresh").click(function() {
        $("#time").html("Reloading...");
        clearTable();
        getStoreData();
    });

    getStoreData();
});
