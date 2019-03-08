$(function () {
  // watch models
  var modelList = {
    "MU642J/A": "GPS/40/S/White Band",
    "MU6A2J/A": "GPS/44/S/White Band",
    "MU662J/A": "GPS/40/SG/Black Band",
    "MU6D2J/A": "GPS/44/SG/Black Band",
    "MU682J/A": "GPS/40/G/Pink Sand Band",
    "MU6F2J/A": "GPS/44/G/Pink Sand Band",

    "MU652J/A": "GPS/40/S/Seashell Loop",
    "MU6C2J/A": "GPS/44/S/Seashell Loop",
    "MU672J/A": "GPS/40/SG/Black Loop",
    "MU6E2J/A": "GPS/44/SG/Black Loop",
    "MU692J/A": "GPS/40/G/Pink Sand Loop",
    "MU6G2J/A": "GPS/44/G/Pink Sand Loop",

    "MTVA2J/A": "Cellular/40/S/White Band",
    "MTVR2J/A": "Cellular/44/S/White Band",
    "MTVD2J/A": "Cellular/40/SG/Black Band",
    "MTVU2J/A": "Cellular/44/SG/Black Band",
    "MTVG2J/A": "Cellular/40/G/Pink Sand Band",
    "MTVW2J/A": "Cellular/44/G/Pink Sand Band",

    "MTVC2J/A": "Cellular/40/S/Seashell Loop",
    "MTVT2J/A": "Cellular/44/S/Seashell Loop",
    "MTVF2J/A": "Cellular/40/SG/Black Loop",
    "MTVV2J/A": "Cellular/44/SG/Black Loop",
    "MTVH2J/A": "Cellular/40/G/Pink Sand Loop",
    "MTVX2J/A": "Cellular/44/G/Pink Sand Loop",

    "MTVJ2J/A": "Cellular/40/Steel/White Band",
    "MTX02J/A": "Cellular/44/Steel/White Band",
    "MTVL2J/A": "Cellular/40/SB Steel/Black Band",
    "MTX22J/A": "Cellular/44/SB Steel/Black Band",
    "MTVN2J/A": "Cellular/40/Gold Steel/Stone Band",
    "MTX42J/A": "Cellular/44/Gold Steel/Stone Band",

    "MTVK2J/A": "Cellular/40/Steel/Milanese Loop",
    "MTX12J/A": "Cellular/44/Steel/Milanese Loop",
    "MTVM2J/A": "Cellular/40/SB Steel/SB Milanese Loop",
    "MTX32J/A": "Cellular/44/SB Steel/SB Milanese Loop",
    "MTVQ2J/A": "Cellular/40/Gold Steel/Gold Milanese Loop",
    "MTX52J/A": "Cellular/44/Gold Steel/Gold Milanese Loop",


    "MU6H2J/A": "Nike+ GPS/40/S/Pure Platinum Black Band",
    "MU6K2J/A": "Nike+ GPS/44/S/Pure Platinum Black Band",
    "MU6J2J/A": "Nike+ GPS/40/SG/Anthracite Black Band",
    "MU6L2J/A": "Nike+ GPS/44/SG/Anthracite Black Band",

    "MU7F2J/A": "Nike+ GPS/40/S/Summit White Loop",
    "MU7H2J/A": "Nike+ GPS/44/S/Summit White Loop",
    "MU7G2J/A": "Nike+ GPS/40/SG/Black Loop",
    "MU7J2J/A": "Nike+ GPS/44/SG/Black Loop",

    "MTX62J/A": "Nike+ Cellular/40/S/Pure Platinum Black Band",
    "MTXK2J/A": "Nike+ Cellular/44/S/Pure Platinum Black Band",
    "MTXG2J/A": "Nike+ Cellular/40/SG/Anthracite Black Band",
    "MTXM2J/A": "Nike+ Cellular/44/SG/Anthracite Black Band",

    "MTXF2J/A": "Nike+ Cellular/40/S/Summit White Loop",
    "MTXJ2J/A": "Nike+ Cellular/44/S/Summit White Loop",
    "MTXH2J/A": "Nike+ Cellular/40/SG/Black Loop",
    "MTXL2J/A": "Nike+ Cellular/44/SG/Black Loop",


    "MU7L2J/A": "Hermès/40/Indigo Craie Orange Double Tour",
    "MU732J/A": "Hermès/40/Bordeaux Rose Extrême Rose Azalée Double Tour",
    "MU722J/A": "Hermès/40/Bleu Indigo Double Tour",
    "MU712J/A": "Hermès/40/Fauve Barenia Double Tour",
    "MU782J/A": "Hermès/44/Indigo Craie Orange Single Tour",
    "MU702J/A": "Hermès/40/Bordeaux Rose Extrême Rose Azalée Single Tour",
    "MU772J/A": "Hermès/44/Bleu Indigo Single Tour",
    "MU6Y2J/A": "Hermès/40/Fauve Barenia Single Tour",
    "MU762J/A": "Hermès/44/Fauve Barenia Single Tour",
    "MU9E2J/A": "Hermès/44/Fauve Grained Barenia Rallye",
    "MU742J/A": "Hermès/44/Fauve Barenia Buckle",
    "MU752J/A": "Hermès/44/Ébène Barenia Buckle"
  };

  var shopList = {};

  function getModelListUrl() {
    var url = "";
    var i = 0;
    for (var key in modelList) {
      url = url + "&parts." + i + "=" + key;
      i++;
    }
    return url;
  }

  function getPickupData2(preData) {
    var url = 'https://www.apple.com/jp/shop/retail/pickup-message?pl=true&searchNearby=true&store=R048' + getModelListUrl();
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
        stockData = preData;
        var stores = data.body["stores"];
        if (!stores) {
          $("#time").html("No data. Try later.");
          return;
        }
        for (var index in stores) {
          var store = stores[index];
          //var store = stores;
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

  function getPickupData() {
    var url = 'https://www.apple.com/jp/shop/retail/pickup-message?pl=true&searchNearby=true&store=R224' + getModelListUrl();
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
        getPickupData2(stockData);
      },
      error: function (e) { alert("error!" + e.statusText); return; }
    });
  }

  function getStoreData() {
    getPickupData();
    return;

    // var url = 'https://www.apple.com/jp/shop/retail/pickup-message?pl=false&searchNearby=true&parts.0=MU682J%2FA&store=R224';
    // // get json data
    // $.ajax({
    //   url: "https://query.yahooapis.com/v1/public/yql?" + "q=select%20*%20from%20json%20where%20url%3D%22" + encodeURIComponent(url) + "%22&format=json",
    //   beforeSend: function (xhr) {
    //     if (xhr.overrideMimeType) {
    //       xhr.overrideMimeType("application/json");
    //     }
    //   },
    //   dataType: 'json',
    //   async: true,
    //   cache: false,
    //   success: function (data) {
    //     if (!data.query.results || !data.query.results.json) {
    //       $("#time").html("No data. Try later.");
    //       return;
    //     }
    //     // 2017 - now
    //     if (!data.query.results.json["stores"]) {
    //       getPickupData();
    //       return;
    //     }
    //     // legacy way
    //     for (var index in data.query.results.json["stores"]) {
    //       var store = data.query.results.json["stores"][index];
    //       shopList[store["storeNumber"]] = store["storeName"];
    //     }
    //     drawWatchList();
    //     getStockData();
    //   },
    //   error: function (e) { alert("error!" + e.statusText); return; }
    // });
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

//   function getStockData() {
//     var url = 'https://reserve-prime.apple.com/JP/ja_JP/reserve/iPhoneX/availability.json';
// 
//     // get json data
//     $.ajax({
//       url: "https://query.yahooapis.com/v1/public/yql?" + "q=select%20*%20from%20json%20where%20url%3D%22" + encodeURIComponent(url) + "%22&format=json",
//       //url: "stock.json",
//       beforeSend: function (xhr) {
//         if (xhr.overrideMimeType) {
//           xhr.overrideMimeType("application/json");
//         }
//       },
//       dataType: 'json',
//       async: true,
//       cache: false,
//       success: function (data) {
//         clearTable();
//         if (!data.query.results) {
//           $("#time").html("No data. Try later.");
//           return;
//         }
//         //alert(data);
//         drawTable(data.query.results.json);
//         checkStockData(data.query.results.json);
//       },
//       error: function (e) { alert("error!" + e.statusText); return; }
//     });
// 
//   }

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
