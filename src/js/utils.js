function getIP(json) {
	//for IP addresses 
	//https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only	
    params.userIP = json.ip;
    console.log("IP address : ", params.userIP)
}



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



