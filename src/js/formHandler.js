function sendToGoogleSheet(data){
	//send a javascript Object to the Google form accessed by the url below. 
	//that url points to a google script attached to the google sheet, and will also append a timestamp

	d3.selectAll('.error').classed('error', false);
	d3.selectAll('.errorBorder').classed('errorBorder', false);

	console.log('sending to Google');
	params.nTrials += 1;

	var jqxhr = $.ajax({
		url: params.googleAPIurl,
		method: "GET",
		dataType: "json",
		data: data,
		success:function(d){
			console.log('submitted data', JSON.stringify(data), d);
			d3.select('#notification')
				.classed('blink_me', false)
				.text('Responses submitted successfully.  You can change your responses anytime by re-submitting.');
		},
		error: function (request, status, error) {
			console.log('failed to submit', request, status, error);
			if (params.nTrials < params.maxTrials){
				sendToGoogleSheet(data);
			} else {
				d3.select('#notification')
					.classed('blink_me', false)
					.classed('error', false)
					.text('Responses failed to be submitted.  Please refresh your browser and try again.');
			}
		}
	});

}

function onFormSubmit(){
	console.log('username',params.username);

	missing = [];
	if (params.username != ""){
		d3.select('#username').property('disabled', true);

		params.nTrials = 0;
		d3.select('#notification')
			.classed('blink_me', true)
			.classed('error', false)
			.text('Processing...');

		//gather the values from the form and sendToGoogleSheet (function above)
		d3.select('#paraForm').selectAll('select').each(function(d,i){
			var id = this.id;
			var options = d3.select(this).selectAll('option')
			options.each(function(dd, j){
				if (this.selected && !this.disabled){
					params.paraData[id] = this.value;
				} 
				if (this.selected && this.disabled){
					missing.push(id);
				} 
			})
		});

		//add the IP
		params.paraData['IP'] = params.userIP;

		//add the username
		params.paraData['username'] = params.username;
		if (missing.length == 0){
			console.log("form data", params.paraData);
			sendToGoogleSheet(params.paraData);
		} else {
			console.log("missing", missing)
			d3.select('#notification')
				.classed('blink_me', false)
				.classed('error', true)
				.text('Please classify all terms in Step (2) above.');
			missing.forEach(function(m){
				d3.select(d3.select('#'+m).node().parentNode).classed('errorBorder', true);
			})
		}
	} else {
		d3.select('#notification')
			.classed('blink_me', false)
			.classed('error', true)
			.text('Please enter a username in Step (1) above.');
		d3.select('#usernameLabel').classed('error', true);

	}

}