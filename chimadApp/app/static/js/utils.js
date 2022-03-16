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

function resetURLdata(saveFields = []){
	//readURLdata();

	//then reset the url
	var newURL = window.location.href.split("?")[0];
	//savefields 
	saveFields.forEach(function(field){
		if (params.URLInputValues.hasOwnProperty(field)) newURL += '?' + field + '=' + params.URLInputValues[field];
	});
	window.history.replaceState(null, "", newURL); //so that the page doesn't reload every time

	readURLdata();

}

function getURLFields(){
	var urlFull = window.location.href;
	var p = urlFull.indexOf('?');
	var urlMain = urlFull;
	var urlAddOn = '';
	if (p > 0) {
		urlMain = urlFull.substring(0, p);
		urlAddOn = urlFull.substring(p);
	}
	var p = urlMain.lastIndexOf('/');
	var urlStart = urlMain.substring(0,p+1);

	return {'urlStart':urlStart,'urlAddOn':urlAddOn};
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
function wrapSVGtext(text, width, textToUse) {
	var fs0 = 18; //px
	text.each(function () {
		if (!textToUse) textToUse = d3.select(this).text();
		var text = d3.select(this),
			words = textToUse.replaceAll('/','/ ').split(/\s+/).reverse(),
			//words = text.text().split(/\s+/).reverse(),
			word,
			splitLine = false,
			startBullet = false,
			haveBullet = false,
			hadBullet = false,
			line = [],
			lineHeight = fs0*1.1, // px
			x = text.attr("x"),
			y = text.attr("y"),
			dy = 0, 
			fs = fs0, //px
			tspan = text.text(null).append("tspan")
						.style('font-size', fs + 'px')
						.attr('class','wrappedSVGtext')
						.attr("x", x)
						.attr("y", y)
						.attr("dy", dy + 'px');
		while (word = words.pop()) {

			var wordToUse = word.replace('\\n','').replaceAll('{-}','&nbsp&nbsp&#8226&nbsp').replaceAll('/ ','/');

			line.push(wordToUse);

			//check for my special characters, save the locations and remove them
			tspan.text(params.removeSubSuperString(line.join(" ").replaceAll('/ ','/')));

			//check if we're over the line length limit
			//create an temporary tspan that has text without the nbsp characters (for bullets)
			var tmpTxt = tspan.text().replaceAll('&nbsp',' ').replaceAll('&#8226',' ')
			var nSpaces = (tspan.text().match(/&nbsp/g) || []).length + (tspan.text().match(/&#8226/g) || []).length;
			var tmpTspan = text.append('tspan').text(tmpTxt)
			if (tmpTspan.node().getComputedTextLength() + nSpaces > width && line.length > 1) splitLine = true;
			tmpTspan.remove();

			// deal with bullets and vertical spacing
			startBullet = false;

			//check for bullet
			if (word.includes('{-}')) {
				startBullet = true;
				haveBullet = true;
				hadBullet = true;
			}

			//modify the font size and line height for bullets
			(haveBullet) ? (fs = 0.75*fs0) : (fs = fs0);
			lineHeight = fs*1.1;

			//add space above when a bullet starts
			if (startBullet) dy += 0.25*fs0;

			// add space after the end of a stretch of bullets
			if (hadBullet && !haveBullet) {
				dy += 0.25*fs0;
				hadBullet = false;
			}
				
			//split the line
			if (splitLine) {
				line.pop();
				if (haveBullet && !startBullet) wordToUse = '&nbsp&nbsp&nbsp&nbsp' + wordToUse;
				tspan.text(line.join(" ").replaceAll('/ ','/'));
				line = [wordToUse];
				dy += lineHeight;
				tspan = text.append("tspan")
							.attr('class','wrappedSVGtext')
							.attr("x", x)
							.attr("y", y)
							.attr('dy', dy + 'px')
							.style('font-size', fs + 'px')
							.text(wordToUse)
			}


			//check for return character
			splitLine = false;
			if (word.slice(-2) == '\\n' || word.slice(-2) == '\\r') {
				splitLine = true;
				haveBullet = false;
			}
		}

		//fix the last line in case it had sub- or super-script tags
		tspan.text(line.join(" ").replaceAll('/ ','/'));

	});
}

//https://stackoverflow.com/questions/3410464/how-to-find-indices-of-all-occurrences-of-one-string-in-another-in-javascript
function getStrIndicesOf(searchStr, str, caseSensitive) {
	var searchStrLen = searchStr.length;
	if (searchStrLen == 0) {
		return [];
	}
	var startIndex = 0, index, indices = [];
	if (!caseSensitive) {
		str = str.toLowerCase();
		searchStr = searchStr.toLowerCase();
	}
	while ((index = str.indexOf(searchStr, startIndex)) > -1) {
		indices.push(index);
		startIndex = index + searchStrLen;
	}
	return indices;
}
function eventFire(el, etype, ev){
	//console.log('trying to click', el, etype, ev)
	if (ev) ev.preventDefault();
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

function objectWithoutProperties(obj, keys) {
	var target = {};
	for (var i in obj) {
		if (keys.indexOf(i) >= 0) continue;
		if (!obj.hasOwnProperty(i)) continue;
		target[i] = obj[i];
	}
	return target;
}

function parseTranslateAttr(elem){
	var trans = d3.select(elem).attr('transform').replace('translate(','').replace(')','').split(',');
	return {'x': trans[0], 'y':trans[1]};

}

//https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
//the simple version to clone an object (but note that this will not handle descendants)
function cloneObject(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

function lowerArray(arr){
	arrl = [];
	arr.forEach(function(d){
		arrl.push(d.toLowerCase());
	})
	return arrl;
}

//https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}