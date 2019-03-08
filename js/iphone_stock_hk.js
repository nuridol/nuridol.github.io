$(function () {
  // Xs models
  var modelList={
  "MT952ZA/A" : "Xs 64GB Silver",
  "MT982ZA/A" : "Xs 256GB Silver",
  "MT9C2ZA/A" : "Xs 512GB Silver",
  "MT942ZA/A" : "Xs 64GB Space Gray",
  "MT972ZA/A" : "Xs 256GB Space Gray",
  "MT9A2ZA/A" : "Xs 512GB Space Gray",
  "MT962ZA/A" : "Xs 64GB Gold",
  "MT992ZA/A" : "Xs 256GB Gold",
  "MT9D2ZA/A" : "Xs 512GB Gold",

  "MT722ZA/A" : "Xs Max 64GB Silver",
  "MT752ZA/A" : "Xs Max 256GB Silver",
  "MT782ZA/A" : "Xs Max 512GB Silver",
  "MT712ZA/A" : "Xs Max 64GB Space Gray",
  "MT742ZA/A" : "Xs Max 256GB Space Gray",
  "MT772ZA/A" : "Xs Max 512GB Space Gray",
  "MT732ZA/A" : "Xs Max 64GB Gold",
  "MT762ZA/A" : "Xs Max 256GB Gold",
  "MT792ZA/A" : "Xs Max 512GB Gold"
  };

 //  // X models
 //  var modelList={
	// "MQA52ZP/A" : "X 64GB Space Gray",
	// "MQA62ZP/A" : "X 64GB Silver",
	// "MQA82ZP/A" : "X 256GB Space Gray",
	// "MQA92ZP/A" : "X 256GB Silver"
 //  };
//   // 7 models
//   var modelList={
//     "MN8H2ZP/A" : "7 32GB Silver",
//     "MN8J2ZP/A" : "7 32GB Gold",
//     "MN8K2ZP/A" : "7 32GB Rose Gold",
//     "MN8G2ZP/A" : "7 32GB Black",
// 
//     "MN8M2ZP/A" : "7 128GB Silver",
//     "MN8N2ZP/A" : "7 128GB Gold",
//     "MN8P2ZP/A" : "7 128GB Rose Gold",
//     "MN8L2ZP/A" : "7 128GB Black",
//     "MN8Q2ZP/A" : "7 128GB Jet Black",
// 
//     "MN8T2ZP/A" : "7 256GB Silver",
//     "MN8U2ZP/A" : "7 256GB Gold",
//     "MN8V2ZP/A" : "7 256GB Rose Gold",
//     "MN8R2ZP/A" : "7 256GB Black",
//     "MN8W2ZP/A" : "7 256GB Jet Black",
// 
//     "MNQJ2ZP/A" : "7+ 32GB Silver",
//     "MNQK2ZP/A" : "7+ 32GB Gold",
//     "MNQL2ZP/A" : "7+ 32GB Rose Gold",
//     "MNQH2ZP/A" : "7+ 32GB Black",
// 
//     "MN492ZP/A" : "7+ 128GB Silver",
//     "MN4A2ZP/A" : "7+ 128GB Gold",
//     "MN4C2ZP/A" : "7+ 128GB Rose Gold",
//     "MN482ZP/A" : "7+ 128GB Black",
//     "MN4D2ZP/A" : "7+ 128GB Jet Black",
// 
//     "MN4F2ZP/A" : "7+ 256GB Silver",
//     "MN4J2ZP/A" : "7+ 256GB Gold",
//     "MN4K2ZP/A" : "7+ 256GB Rose Gold",
//     "MN4E2ZP/A" : "7+ 256GB Black",
//     "MN4L2ZP/A" : "7+ 256GB Jet Black"
//   }

  // 6 models
  // var modelList={
  //   "MG472ZP/A" : "6 16GB Gray",
  //   "MG4H2ZP/A" : "6 16GB Silver",
  //   "MG492ZP/A" : "6 16GB Gold",
  //   "MG4F2ZP/A" : "6 64GB Gray",
  //   "MG482ZP/A" : "6 64GB Silver",
  //   "MG4J2ZP/A" : "6 64GB Gold",
  //   "MG4A2ZP/A" : "6 128GB Gray",
  //   "MG4C2ZP/A" : "6 128GB Silver",
  //   "MG4E2ZP/A" : "6 128GB Gold",
  //   "MGA82ZP/A" : "6+ 16GB Gray",
  //   "MGA92ZP/A" : "6+ 16GB Silver",
  //   "MGAA2ZP/A" : "6+ 16GB Gold",
  //   "MGAH2ZP/A" : "6+ 64GB Gray",
  //   "MGAJ2ZP/A" : "6+ 64GB Silver",
  //   "MGAK2ZP/A" : "6+ 64GB Gold",
  //   "MGAC2ZP/A" : "6+ 128GB Gray",
  //   "MGAE2ZP/A" : "6+ 128GB Silver",
  //   "MGAF2ZP/A" : "6+ 128GB Gold"
  // };

  // 6s models
  // var modelList={
  //  "MKQJ2ZP/A" : "6s 16GB Gray",
  //  "MKQK2ZP/A" : "6s 16GB Silver",
  //  "MKQL2ZP/A" : "6s 16GB Gold",
  //  "MKQM2ZP/A" : "6s 16GB Rose Gold",
  //  "MKQN2ZP/A" : "6s 64GB Gray",
  //  "MKQP2ZP/A" : "6s 64GB Silver",
  //  "MKQQ2ZP/A" : "6s 64GB Gold",
  //  "MKQR2ZP/A" : "6s 64GB Rose Gold",
  //  "MKQUZP/A" : "6s 128GB Gray",
  //  "MKQT2ZP/A" : "6s 128GB Silver",
  //  "MKQV2ZP/A" : "6s 128GB Gold",
  //  "MKQW2ZP/A" : "6s 128GB Rose Gold",
  //  "MKU12ZP/A" : "6s+ 16GB Gray",
  //  "MKU22ZP/A" : "6s+ 16GB Silver",
  //  "MKU32ZP/A" : "6s+ 16GB Gold",
  //  "MKU52ZP/A" : "6s+ 16GB Rose Gold",
  //  "MKU62ZP/A" : "6s+ 64GB Gray",
  //  "MKU72ZP/A" : "6s+ 64GB Silver",
  //  "MKU82ZP/A" : "6s+ 64GB Gold",
  //  "MKU92ZP/A" : "6s+ 64GB Rose Gold",
  //  "MKUD2ZP/A" : "6s+ 128GB Gray",
  //  "MKUE2ZP/A" : "6s+ 128GB Silver",
  //  "MKUF2ZP/A" : "6s+ 128GB Gold",
  //  "MKUG2ZP/A" : "6s+ 128GB Rose Gold"
  // };

  var shopList={
  // "R499": "Canton Road",
  // "R409": "Causeway Bay",
  // "R485": "Festival Walk"
  };

  function getModelListUrl() {
    var url = "";
    var i = 0;
    for (var key in modelList) {
      url = url + "&parts." + i + "=" + key;
      i++;
    }
    return url;
  }

  function getPickupData() {
    var url = 'https://www.apple.com/hk/shop/retail/pickup-message?pl=true&searchNearby=true&store=R499' + getModelListUrl();
    // get json data
    $.ajax({
        url: 'https://cors.io?' + url,
      //url: 'proxy.php?csurl=' + encodeURIComponent(url),
      //url: "pickup.json",
      beforeSend: function (xhr) {
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType("application/json");
        }
      },
      dataType: 'json',
      async: true,
      cache: false,
      success: function (data) {
        if (!data.body || !data.body.stores) {
          $("#time").html("No data. Try later.");
          return;
        }
        stockData = { "updated": (new Date).getTime() };
        var stores = data.body["stores"];
        if (!stores) {
          $("#time").html("No data. Try later.");
          return;
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
            stockData["stores"][storeCode][modelId] = { "availability": { "contract": flag, "unlocked": flag } };
          }
        }
        drawWatchList();
        clearTable();
        drawTable(stockData);
        checkStockData(stockData);
      },
      error: function (e) { alert("error!" + e.statusText); return; }
    });
  }

  function getStoreData() {
    getPickupData();
    return;
//     var url = 'https://www.apple.com/hk/shop/retail/pickup-message?pl=false&searchNearby=false&parts.0=MT952ZA/A&store=R499';
//     // get json data
//     $.ajax({
//       url: "https://query.yahooapis.com/v1/public/yql?" + "q=select%20*%20from%20json%20where%20url%3D%22" + encodeURIComponent(url) + "%22&format=json",
//       beforeSend: function (xhr) {
//         if (xhr.overrideMimeType) {
//           xhr.overrideMimeType("application/json");
//         }
//       },
//       dataType: 'json',
//       async: true,
//       cache: false,
//       success: function (data) {
//         if (!data.query.results || !data.query.results.json) {
//           $("#time").html("No data. Try later.");
//           return;
//         }
//         // 2017 - now
//         if (!data.query.results.json["stores"]) {
//           getPickupData();
//           return;
//         }
// //         // legacy way
// //         for (var index in data.query.results.json["stores"]) {
// //           var store = data.query.results.json["stores"][index];
// //           shopList[store["storeNumber"]] = store["storeName"];
// //         }
// //         drawWatchList();
// //         getStockData();
//       },
//       error: function (e) { alert("error!" + e.statusText); return; }
//     });
  }

  // function getStoreDataLegacy() {
  //   var url = 'https://reserve-prime.apple.com/JP/ja_JP/reserve/iPhoneX/stores.json';
  //   // get json data
  //   $.ajax({
  //     url: "https://query.yahooapis.com/v1/public/yql?"+ "q=select%20*%20from%20json%20where%20url%3D%22"+ encodeURIComponent(url)+ "%22&format=json",
  //     beforeSend: function(xhr){
  //       if (xhr.overrideMimeType)
  //       {
  //         xhr.overrideMimeType("application/json");
  //       }
  //     },
  //     dataType: 'json',
  //     async: true,
  //     cache: false,
  //     success: function(data) {
  //       if (!data.query.results || !data.query.results.json) {
  //         $("#time").html("No data. Try later.");
  //         return;
  //       }
  //       if (!data.query.results.json["stores"]) {
  //         getPickupData();
  //         return;
  //       }
  //       for (var index in data.query.results.json["stores"]) {
  //         var store = data.query.results.json["stores"][index];
  //         shopList[store["storeNumber"]] = store["storeName"];
  //       }
  //       drawWatchList();
  //       getStockData();
  //     },
  //     error: function(e) { alert("error!" + e.statusText); return; }
  //   });
  // }

  function getStockData() {
    var url = 'https://reserve-prime.apple.com/JP/ja_JP/reserve/iPhoneX/availability.json';

    // get json data
    $.ajax({
      url: "https://query.yahooapis.com/v1/public/yql?" + "q=select%20*%20from%20json%20where%20url%3D%22" + encodeURIComponent(url) + "%22&format=json",
      //url: "stock.json",
      beforeSend: function (xhr) {
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType("application/json");
        }
      },
      dataType: 'json',
      async: true,
      cache: false,
      success: function (data) {
        clearTable();
        if (!data.query.results) {
          $("#time").html("No data. Try later.");
          return;
        }
        //alert(data);
        drawTable(data.query.results.json);
        checkStockData(data.query.results.json);
      },
      error: function (e) { alert("error!" + e.statusText); return; }
    });

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
      // console.log("check :" + item);
      var codes = item.split('-');
      var shopCode = codes[0];
      var modelCode = codes[1];
      var id = shopCode + "-" + modelCode;
      var name = shopList[shopCode] + " " + modelList[modelCode.replace(/_/, '/')];
      $("#watchList").append('<span id="' + id + '" class="badge badge-primary" style="display:inline-block;margin-right:5px;">' + name + '</span>');
    }

    // console.log($("#watchData").val());
    if ($("#watchData").val().length > 0) {
      // console.log("on");
      toggleWatchButton(true);
    }
    else {
      // console.log("off");
      toggleWatchButton(false);
    }
  }

  function toggleWatch(element) {
    //$("#watchPanel").attr('style', 'display:block;');

    // console.log(element);
    // console.log($(element).closest("tr"));
    // console.log("tr index:" + $(element).closest("tr").index() + " td index:" + $(element).index());

    var shopCode = $("#table > thead > tr > th:eq(" + $(element).index() + ")").attr('data-shopcode');
    var shopName = $("#table > thead > tr > th:eq(" + $(element).index() + ")").text();
    // console.log(shopCode + shopName);

    var modelCode = $(element).closest("tr").find('th:eq(0)').attr('data-modelcode');
    var modeName = $(element).closest("tr").find('th:eq(0)').text();
    // console.log(modelCode + "/" + modeName);

    modelCode = modelCode.replace("/", "_");
    var id = shopCode + "-" + modelCode;
    if ($('#' + id).length > 0) {
      // console.log("exist");
      // remove
      removeWatch(id);
    }
    else {
      // console.log("not exist");
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
    // console.log("checkStockData");
    if (!$("#watchButton").hasClass("active")) {
      // console.log("return :no watch");
      return;
    }

    var timeText = $("#lastCheck").val();
    if (timeText == $('#time').text()) {
      // nothing
      // console.log("return :" + timeText);
      return;
    }

    // console.log("check start");
    // set new value
    $("#lastCheck").val($('#time').text());

    var checkList = $("#watchData").val().split(",");
    // console.log(data);

    var foundFlag = false;

    for (var i in checkList) {
      var item = checkList[i];
      // console.log("check :" + item);
      var codes = item.split('-');
      var shopCode = codes[0];
      var modelCode = codes[1];
      // console.log(data[shopCode]);
      var flag = data["stores"][shopCode][modelCode]["availability"]["contract"];
      if (flag != "true") {
        flag = data["stores"][shopCode][modelCode]["availability"]["unlocked"];
      }
      // console.log(flag);
      //if (flag == true || flag == 'true') {
      if (flag == "true") {
        // console.log('true!');
        var log = $('#time').text() + " [" + shopList[shopCode] + " " + modelList[modelCode.replace(/_/, '/')] + "] is in stock\n";
        $("#logtext").html($("#logtext").html() + log);
        var psconsole = $('#logtext');
        psconsole.scrollTop(
          psconsole[0].scrollHeight - psconsole.height()
        );
        foundFlag = true;
      }
      else {
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
    // console.log('watch');
    getStoreData();

    // repeat
    var timer = setTimeout(function () { watchStock(); }, 15000);
    // $("#watchButton").click(function() {
    //   if ($("#watchButton").hasClass("active")) {
    //     clearTimeout(timer);
    //     $("#watchButton").removeClass("active");
    //   }
    //   else {
    //     $("#watchButton").addClass("active");
    //   }
    // });
  }

  function toggleWatchButton(flag) {
    if (flag) {
      // console.log($("#watchButton").length);
      // on
      if ($("#watchButton").length == 0) {
        $("#refresh").after('<button type="button" class="btn btn-danger" id="watchButton" style="margin:5px;"><span class="fa fa-repeat"></span> WATCH</button><label><input type="checkbox" id="audiocheck"> Audio</label>');
        $("#watchButton").click(function () {
          if (!$("#watchButton").hasClass("active")) {
            $("#watchButton").addClass("active");
            $("#watchButton").removeClass("btn-danger");
            $("#watchButton").addClass("btn-info");
            watchStock();
          }
        });
      }
    }
    else {
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
    // console.log(data);
    // var string="";

    // date
    var date = new Date(parseInt(data["updated"], 10));
    $("#time").html(unixdateformat(date));
    $("#table thead").append('<tr></tr>');
    $("#table thead tr").append('<th class="text-left">type</th>');
    var trs = {};

    for (var shopCode in shopList) {
      // string = string + "<h3>" + shopList[shopCode] + "</h3>";
      $("#table thead tr").append('<th class="shop-column" data-shopcode="' + shopCode + '">' + shopList[shopCode] + '</th>');
      var stockInfo = data["stores"][shopCode];
      for (var model in modelList) {
        if (!trs[model]) {
          trs[model] = new Array();
          trs[model].push('<th class="text-left" data-modelcode="' + model + '">' + modelList[model] + '</th>');
        }
        var check = stockInfo[model];
        if (!check) {
          check = stockInfo[model.replace("/", "_")];
        }
        //if (check == true || check == "true") {
        if (check["availability"]["contract"] == "true" || check["availability"]["unlocked"] == "true") {
          // string = string + "<p>" + modelList[model] + ": OK</p>";
          trs[model].push('<td class="table-success shop-column"><span class="fa fa-check"></span></td>');
        }
        else {
          // string = string + "<p>" + modelList[model] + ": X</p>";
          trs[model].push('<td class="shop-column text-secondary"><span class="fa fa-times fa-sm"></span></td>');
        }
      }
    }

    for (var key in trs) {
      $("#table tbody").append('<tr>' + trs[key].join("") + '</tr>');
    }
    // add event
    $("#table > tbody > tr > td").click(function () {
      toggleWatch(this);
    });
    //$("#result").html(string);
  }

  // start
  $("#refresh").click(function () {
    $("#time").html("Reloading...");
    clearTable();
    getStoreData();
  });

  getStoreData();

});
