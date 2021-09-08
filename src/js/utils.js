// function getIP(json) {
// 	//for IP addresses 
// 	//https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only	
//     params.userIP = json.ip;
//     console.log("IP address : ", params.userIP)
// }



function readURLdata(){
	params.URLInputValues = {};
	//read form data from the URL, if present
	window.location.href.split("?").forEach(function(d){
		if (d.includes('=')){
			val = d.split('=');
			params.URLInputValues[val[0]] = val[1];
		}
	});
	console.log('URL input values ', params.URLInputValues);
}


function appendURLdata(){
	//append new form data to the URL
	var newURL = window.location.href.split("?")[0];
	var keys = Object.keys(params.URLInputValues);
	keys.forEach(function(k,i){
		newURL += '?'+k+'='+params.URLInputValues[k];
		if (i == keys.length - 1){
			//window.location.href = newURL; //would reload the page
			window.history.replaceState(null, "", newURL); //so that the page doesn't reload every time
		}
	});
}

function resetURLdata(){
	readURLdata();

	//then reset the url
	var newURL = window.location.href.split("?")[0];
	//save the username if it exists
	if (params.URLInputValues.hasOwnProperty('username')) newURL += '?username='+params.URLInputValues.username;
	window.history.replaceState(null, "", newURL); //so that the page doesn't reload every time

	readURLdata();

}

//https://stackoverflow.com/questions/20798477/how-to-find-index-of-all-occurrences-of-element-in-array#:~:text=The%20.,val%2C%20i%2B1))%20!%3D
function getAllIndices(arr, val) {
	var indices = [], i;
	for(i = 0; i < arr.length; i++)
		if (arr[i] === val)
			indices.push(i);
	return indices;
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

function eventFire(el, etype){
	//console.log('trying to click', el, etype)
	if (el){
		if (el.fireEvent) {
			el.fireEvent('on' + etype);
		} else {
			var evObj = document.createEvent('Events');
			evObj.initEvent(etype, true, false);
			el.dispatchEvent(evObj);
		}
	}
}

//https://gomakethings.com/finding-the-next-and-previous-sibling-elements-that-match-a-selector-with-vanilla-js/
function getNextSibling(elem, selector) {

	// Get the next sibling element
	var sibling = elem.nextElementSibling;

	// If there's no selector, return the first sibling
	if (!selector) return sibling;

	// If the sibling matches our selector, use it
	// If not, jump to the next sibling and continue the loop
	while (sibling) {
		if (sibling.matches(selector)) return sibling;
		sibling = sibling.nextElementSibling
	}
};
function getPrevSibling(elem, selector) {

	// Get the next sibling element
	var sibling = elem.previousElementSibling;

	// If there's no selector, return the first sibling
	if (!selector) return sibling;

	// If the sibling matches our selector, use it
	// If not, jump to the next sibling and continue the loop
	while (sibling) {
		if (sibling.matches(selector)) return sibling;
		sibling = sibling.previousElementSibling;
	}
};

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}