<!--
/* http://www.alistapart.com/articles/zebratables/ */
function removeClassName (elem, className) {
	elem.className = elem.className.replace(className, "").trim();
}

function addCSSClass (elem, className) {
	removeClassName (elem, className);
	elem.className = (elem.className + " " + className).trim();
}

String.prototype.trim = function() {
	return this.replace( /^\s+|\s+$/, "" );
}

function stripedTable() {
	if (document.getElementById && document.getElementsByTagName) {  
		var allTables = document.getElementsByTagName('table');
		if (!allTables) { return; }

		for (var i = 0; i < allTables.length; i++) {
			if (allTables[i].className.match(/[\w\s ]*timeTable[\w\s ]*/)) {
				var trs = allTables[i].getElementsByTagName("tr");
				for (var j = 0; j < trs.length; j++) {
					removeClassName(trs[j], 'normalRow');
					addCSSClass(trs[j], 'alternateRow');
				}
				for (var k = 0; k < trs.length; k += 2) {
					removeClassName(trs[k], 'alternateRow');
					addCSSClass(trs[k], 'normalRow');

					var tds = trs[k].getElementsByTagName("td");
					if (tds.length == 3) {
						addCSSClass(tds[0], 'time');
						addCSSClass(tds[1], 'line');
						addCSSClass(tds[2], 'info');
					}
				}
			}
		}
	}
}

addEvent(window, 'load', stripedTable)
-->