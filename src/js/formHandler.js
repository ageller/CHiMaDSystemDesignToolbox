function sendToGoogleSheet(data){
	//send a javascript Object to the Google form accessed by the url below. 
	//that url points to a google script attached to the google sheet, and will also append a timestamp

	console.log('sending to Google');

	var jqxhr = $.ajax({
		url: params.googleAPIurl,
		method: "GET",
		dataType: "json",
		data: data,
		success:function(d){
			console.log('submitted data', JSON.stringify(data), d);
		}
	});

}

function onFormSubmit(){
	//gather the values from the form and sendToGoogleSheet (function above)
	d3.select('#paraForm').selectAll('select').each(function(d,i){
		var id = this.id;
		var options = d3.select(this).selectAll('option')
		options.each(function(dd, j){
			if (this.selected && !this.disabled){
				params.paraData[id] = this.value
			}
		})
	});

	//add the IP
    params.paraData['IP'] = params.userIP;

	console.log("form data", params.paraData);
	sendToGoogleSheet(params.paraData);

}