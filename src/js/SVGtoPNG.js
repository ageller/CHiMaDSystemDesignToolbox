function saveImage(svgNode, renderX, renderY, filename){
	var svgString = getSVGString(svgNode);

	console.log('saving image ', renderX, renderY, filename);
	svgString2Image( svgString, renderX, renderY, 'png', save );

	function save(dataBlob, filesize){
		saveAs(dataBlob, filename); // FileSaver.js function
	}


}


// Below are the functions that handle actual exporting:

function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;



	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		var toAdd = getCSS(parentElement);
		Array.prototype.push.apply(selectorTextArr, toAdd);

		// Add Children element Ids and Classes to the list
		var children = parentElement.getElementsByTagName('*');
		for (var i = 0; i < children.length; i++){
			var toAdd = getCSS(children[i]);
			Array.prototype.push.apply(selectorTextArr, toAdd);
		}

		//add the body, in case styles are there as well
		selectorTextArr.push('body')
		//console.log('have these selectors', selectorTextArr);

		// Extract CSS Rules
		var extractedCSSText = '';
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			try {
				if(!s.cssRules) continue;
			} catch( e ) {
					if(e.name !== 'SecurityError') throw e; // for Firefox
					continue;
				}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) ){
					extractedCSSText += resolveCSSvars(cssRules[r].cssText);

				}
			}
		}
		
		return extractedCSSText;


		function resolveCSSvars(text){
			while (text.indexOf('var(') > 0){
				var index1 = text.indexOf('var(') + 4;
				var foo = text.substring(index1);
				var index2 = foo.indexOf(')');
				var bar = foo.substring(0,index2);

				var value = getComputedStyle(document.body).getPropertyValue(bar)

				text = text.replace('var('+bar+')', value);
			}

			return text;

		}
		function getCSS(node){
			var out = [];
			var id = node.id;
			if ( !contains('#'+id, out) ) out.push( '#'+id );

			var classes = node.classList;
			for (var c = 0; c < classes.length; c++){
				if ( !contains('.'+classes[c], out) ) out.push( '.'+classes[c] );
			}

			return out;
		}


		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement('style');
		styleElement.setAttribute('type','text/css'); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;

}