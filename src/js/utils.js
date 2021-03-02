// function getIP(json) {
// 	//for IP addresses 
// 	//https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only	
//     params.userIP = json.ip;
//     console.log("IP address : ", params.userIP)
// }



function readURLdata(){
	//read form data from the URL, if present
	window.location.href.split("?").forEach(function(d){
		if (d.includes('=')){
			val = d.split('=');
			params.URLinputValues[val[0]] = val[1];
		}
	});
	console.log('URL input values ', params.URLinputValues)
}


function appendURLdata(){
	//append new form data to the URL
	var newURL = window.location.href.split("?")[0];
	var keys = Object.keys(params.URLinputValues);
	keys.forEach(function(k,i){
		newURL += '?'+k+'='+params.URLinputValues[k];
		if (i == keys.length - 1){
			//window.location.href = newURL; //would reload the page
			window.history.replaceState(null, "", newURL); //so that the page doesn't reload every time
		}
	});
}


//https://bl.ocks.org/mbostock/7555321
//https://stackoverflow.com/questions/24784302/wrapping-text-in-d3/24785497
function wrapSVGtext(text, width) {
	text.each(function () {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			x = text.attr("x"),
			y = text.attr("y"),
			dy = 0, //parseFloat(text.attr("dy")),
			tspan = text.text(null)
						.append("tspan")
						.attr("x", x)
						.attr("y", y)
						.attr("dy", dy + "em");
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width && line.length > 1) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan")
							.attr("x", x)
							.attr("y", y)
							.attr("dy", ++lineNumber * lineHeight + dy + "em")
							.text(word);
			}
		}
		
	});
}