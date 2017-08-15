$(function () {
	var modelList={
	    "MG472J/A" : "6 16GB Gray",
	    "MG482J/A" : "6 16GB Silver",
	    "MG492J/A" : "6 16GB Gold",
	    "MG4F2J/A" : "6 64GB Gray",
	    "MG4H2J/A" : "6 64GB Silver",
	    "MG4J2J/A" : "6 64GB Gold",
	    "MG4A2J/A" : "6 128GB Gray",
	    "MG4C2J/A" : "6 128GB Silver",
	    "MG4E2J/A" : "6 128GB Gold",
	    "MGA82J/A" : "6+ 16GB Gray",
	    "MGA92J/A" : "6+ 16GB Silver",
	    "MGAA2J/A" : "6+ 16GB Gold",
	    "MGAH2J/A" : "6+ 64GB Gray",
	    "MGAJ2J/A" : "6+ 64GB Silver",
	    "MGAK2J/A" : "6+ 64GB Gold",
	    "MGAC2J/A" : "6+ 128GB Gray",
	    "MGAE2J/A" : "6+ 128GB Silver",
	    "MGAF2J/A" : "6+ 128GB Gold"
	};
	var shopList={
		"R119": "Shibuya",
		"R224": "Omotesando",
		"R079": "Ginza"
	};

	function getStoreData() {
      var url = 'https://reserve.cdn-apple.com/JP/ja_JP/reserve/iPhone/stores.json';

      // get json data
      $.ajax({
        url: "https://query.yahooapis.com/v1/public/yql?"+ "q=select%20*%20from%20json%20where%20url%3D%22"+ encodeURIComponent(url)+ "%22&format=json",
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
          if (!data.query.results) {
            $("#time").html("No data. Try later.");
            return;
          }
          for (var index in data.query.results.json["stores"]) {
            var store = data.query.results.json["stores"][index];
            shopList[store["storeNumber"]] = store["storeName"];
          }
          
          getStockData();
      })
      .error(function(e) { alert("error!" + e.statusText); return; });
    }

	function getStockData() {
      var url = 'https://reserve.cdn-apple.com/JP/ja_JP/reserve/iPhone/availability.json';

      // get json data
      $.ajax({
        url: "https://query.yahooapis.com/v1/public/yql?"+ "q=select%20*%20from%20json%20where%20url%3D%22"+ encodeURIComponent(url)+ "%22&format=json",
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
          //alert(data);
          drawTable(data.query.results.json);
      })
      .error(function(e) { alert("error!" + e.statusText); return; });
    }

function unixdateformat(str){
    var objDate = new Date(str);
    var nowDate = new Date();
    myHour = Math.floor((nowDate.getTime()-objDate.getTime()) / (1000*60*60)) + 1;

    var year = objDate.getFullYear();
    var month = objDate.getMonth() + 1;
    var date = objDate.getDate();
    var hours = objDate.getHours();
    var minutes = objDate.getMinutes();
    var seconds = objDate.getSeconds();
    if ( hours < 10 ) { hours = "0" + hours; }
    if ( minutes < 10 ) { minutes = "0" + minutes; }
    if ( seconds < 10 ) { seconds = "0" + seconds; }
    str = year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
	var rtnValue = str;

    return rtnValue;
}

    function drawTable(data) {
//        console.log(data);
//        var string="";

        // date
        var date = new Date( parseInt(data["updated"],10) );
        $("#time").html(unixdateformat(date));
        $("#table thead").append('<th>type</th>');
        var trs = {};

    	for (var shopCode in shopList) {
//          string = string + "<h3>" + shopList[shopCode] + "</h3>";
          $("#table thead").append('<th style="width:10.5%;">'+shopList[shopCode]+'</th>');
          var stockInfo = data[shopCode];
          for (var model in modelList) {
            if (!trs[model]) {
                trs[model] = new Array();
                trs[model].push('<th>'+modelList[model]+'</th>');
            }

          	var check = stockInfo[model];
            if (!check) {
              check = stockInfo[model.replace("/","_")];
            }
            if (check == true || check == "true") {
//          		string = string + "<p>" + modelList[model] + ": OK</p>";
          		trs[model].push('<td class="success"><span class="glyphicon glyphicon-ok"></span></td>');
          	}
          	else {
//          		string = string + "<p>" + modelList[model] + ": X</p>";
          		trs[model].push('<td><span class="glyphicon glyphicon-remove"></span></td>');
          	}
          }
        }
        for (var key in trs) {
          $("#table tbody").append('<tr>'+trs[key].join("")+'</tr>');
        }
        //$("#result").html(string);
    }
    $("#refresh").click(function() {
      $("#time").html("Reloading...");
      $("#table thead").html("");
      $("#table tbody").html("");
      getStoreData();
    });

    getStoreData();

});

