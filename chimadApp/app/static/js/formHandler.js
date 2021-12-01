function sendResponsesToFlask(data, notificationID, startInterval=true, successResponse=null, failResponse=null){

	if (!successResponse) successResponse = 'Responses submitted successfully.  The chart will update automatically when new data are available.  You can change your responses anytime by re-submitting.';
	if (!failResponse) failResponse = 'Responses failed to be submitted.  Please refresh your browser and try again.'

	d3.selectAll('.error').classed('error', false);
	d3.selectAll('.errorBorder').classed('errorBorder', false);

	var out = {'data':data, 'notificationID':notificationID, 'startInterval':startInterval, 'successResponse':successResponse, 'failResponse':failResponse};

	console.log('sending responses to Flask', out);

	//send to flask
	$.ajax({
			url: '/save_responses',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				console.log('responses saved',d);
				if (d.notificationID){
					d3.select('#'+d.notificationID)
						.classed('blink_me', false)
						.classed('error', false)
						.text(d.successResponse);
				}

				//show the aggregated responses (now showing after reading in the data within aggregateParaResults)
				if (d.startInterval && !d.error) {
					loadTable(params.surveyTable, aggregateResults);

					clearInterval(params.loadInterval);
					params.loadInterval = setInterval(function(){
						loadTable(params.surveyTable, aggregateResults);
					}, params.loadIntervalDuration);
				}

				resize();

			},
			error: function(d) {
				console.log('!!! WARNING: responses did not save', d);
				if (d.notificationID){
					d3.select('#'+d.notificationID)
						.classed('blink_me', false)
						.classed('error', true)
						.text(d.failResponse);
				}
			}
		});

}

function onParaSubmit(){
	//when form is submitted, compile responses and send the flask

	console.log('username',params.username);
	var submitted1 = params.paraSubmitted;
	params.paraSubmitted = false;

	missing = [];
	if (params.username != "" && typeof params.username !== 'undefined'){
		d3.select('#usernameInput').property('disabled', true);

		d3.select('#paraNotification')
			.classed('blink_me', true)
			.classed('error', false)
			.text('Processing...');

		//gather the values from the form
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

		//add the IP, username and task (not using IP anymore)
		params.paraData['IP'] = params.userIP;
		params.paraData['username'] = params.username;
		params.paraData['task'] = 'para';
		if (missing.length == 0){
			console.log("form data", params.paraData);
			//createEmail();
			params.paraSubmitted = true;
			//check if the user previously submitted a second version
			var paraVersion = 1;
			params.responses.forEach(function(d,i){
				if (d.username == params.username){
					if (d.task == 'para') paraVersion = Math.max(paraVersion, parseInt(d.version));
				}
			});
			if (submitted1 || paraVersion >= 2) {
				params.paraSubmitted2 = true;
				formatSDC();
				checkSDCvisibility();
			}
			params.paraData['TABLE_NAME'] = params.cleanString(params.paragraphname);

			//send to flask -- this will then return to the sockets.js to start the load interval
			sendResponsesToFlask(params.paraData, 'paraNotification');

		} else {
			console.log("missing", missing)
			d3.select('#paraNotification')
				.classed('blink_me', false)
				.classed('error', true)
				.html('Please classify all terms in Step 3; above.');
			missing.forEach(function(m){
				d3.select(d3.select('#'+m).node().parentNode).classed('errorBorder', true);
			})
		}
	} else {
		d3.select('#paraNotification')
			.classed('blink_me', false)
			.classed('error', true)
			.html('Please enter a username in Step 2; above.');
		d3.select('#usernameLabel').classed('error', true);

	}

}

function onSDCSubmit(){
	//gather all the data from the lines that were drawn, and send them to flask

	params.nTrials = 0;
	d3.select('#SDCNotification')
		.classed('blink_me', true)
		.classed('error', false)
		.text('Processing...');

	params.SDCData = {};
	//add the IP, username and task (not using IP anymore)
	params.SDCData['IP'] = params.userIP;
	params.SDCData['username'] = params.username;
	params.SDCData['TABLE_NAME'] = params.cleanString(params.paragraphname);
	params.SDCData['task'] = 'SDC';
	params.selectionWords.forEach(function(w,i){
		//initialize to empty
		params.SDCData[params.cleanString(w)] = '';
		if (i == params.selectionWords.length - 1){
			//gather all the data and combine into aggregated lists when necessary
			d3.selectAll('.SDCLine').each(function(d,j){
				var elem = d3.select(this)
				var word1 = elem.attr('startSelectionWords');
				var word2 = '';
				if (!params.SDCData[word1].includes(elem.attr('endSelectionWords'))){
					if (params.SDCData[word1] != '') word2 = ' ';
					word2 += elem.attr('endSelectionWords');
					params.SDCData[word1] += word2;
				}

				if (j == d3.selectAll('.SDCLine').size() - 1){
					//send to flask -- this will then return to the sockets.js to start the load interval
					sendResponsesToFlask(params.SDCData, 'SDCNotification');
					params.SDCSubmitted = true;
					console.log('submitted SDC form', params.SDCData);
				}
			})
		}
	})

}

function getUsernameInput(username=null){
	//get the username data from the text input box, and fill in the responses if the username exists

	if (this.value) username = this.value;

	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {
		params.username = username;
		if (!(typeof params.username === 'string') && !(params.username instanceof String)) params.username = '';


		params.URLInputValues = {};
		params.URLInputValues["username"] = params.username;
		params.URLInputValues["paragraphname"] = params.cleanString(params.paragraphname);
		console.log('username ', params.username)

		var ubbox = d3.select('#usernameLabel').node().getBoundingClientRect();
		d3.select('#usernameNotification').text('');

		//reset all the selection words dropdowns
		d3.selectAll('.selectionWord').select('select').selectAll('option').property('selected',false);
		d3.selectAll('.selectionWord').select('select').select('#disabled').property('selected',true);

		params.responses.forEach(function(d,i){
			if (decodeURI(d.username) == decodeURI(params.username)){

				console.log('found user in database', d.username, params.username, d)
				//show notification
				d3.select('#usernameNotification')
					.text('This username exists, and the responses below have been populated accordingly.  If these are not your responses, please change your username.');

				Object.keys(d).forEach(function(k){

					if (k != 'IP' && k != 'Timestamp' && k != 'version' && k !='task' && d[k] != '' && k != 'username') {
						var key = k;
						if (d.task == 'SDC') key = 'SDC'+k;
						//console.log("testing", d, key, k, params.URLInputValues[key], d[k])
						params.URLInputValues[key] = d[k].trim();
					}
				})

			}
			if (i == params.responses.length - 1){
				appendURLdata();
				readURLdata();
				if ('paragraphname' in params.URLInputValues) params.paragraphname = params.cleanString(params.URLInputValues.paragraphname);
				useParaURLdata();
				useSDCURLdata();
			}
		})

		checkSDCvisibility();

	}
}

function updateSurveyTable(){
	params.surveyTable = params.cleanString(params.paragraphname);
}

function createParagraphnameSelect(){

	d3.select('#paragraphnameSelector').selectAll('label').remove();
	d3.select('#paragraphnameSelector').selectAll('select').remove();

	d3.select('#paragraphnameSelector').append('label')
		.attr('for','paragraphnameSelect')
		.html('paragraph name: ')

	var slct = d3.select('#paragraphnameSelector').append('select')
		.attr('id','paragraphnameSelect')
		.attr('name','paragraphnameSelect')
		.on('change',setParagraphnameFromOptions)

	slct.selectAll('option').data(params.availableParagraphnamesOrg).enter().filter(function(d){return d != 'paragraphs'}).append('option')
		.attr('id',function(d){return 'paragraphname'+params.cleanString(d);})
		.attr('value',function(d){return params.cleanString(d);})
		.text(function(d){return d;})
	
	var index = -1;
	params.availableParagraphnamesOrg.filter(function(d){return d != 'paragraphs'}).forEach(function(d,i){
		if (params.cleanString(d) == params.cleanString(params.paragraphname)) index = i;
	})
	slct.node().selectedIndex = index;

}

function setParagraphnameFromOptions(paragraphname=null){
	//this will handle the dropdown menu for the paragraph

	params.switchedParagraphname = true; //will be reset in aggregateResults (called after loadTable returns from flask)

	if (this.value) {
		params.paragraphname = params.cleanString(this.value);
	} else {
		params.paragraphname = params.cleanString(paragraphname);
	}

	console.log('setting paragraphname', params.paragraphname);
	updateSurveyTable();
	clearInterval(params.loadInterval);

	//reset the URL
	resetURLdata();

	//don't show the results until the user submits responses again(?)
	params.paraSubmitted = false;
	params.paraSubmitted2 = false;
	params.showingResults = false;
	params.SDCSubmitted = false;

	//reset the consensus answers, and put the radio button checked on build from Answers (for editSDC)
	if (typeof resetEditSDCAfterParagraphnameInput === "function") resetEditSDCAfterParagraphnameInput();

	//enable username editing
	d3.select('#usernameInput').property('disabled', false);

	checkAnswerTogglesVisibility();

	//update the URL
	params.URLInputValues['paragraphname'] = params.cleanString(params.paragraphname);
	if (params.haveParaEditor) setURLFromAnswers();
	appendURLdata();

	loadTable(params.surveyTable, aggregateResults);

	initPage();
}


function checkAnswerTogglesVisibility(){
	//check if the answers exist, and if not, hide the answers checkboxes (may want to move this to a function, like I did with SDC?)
	d3.selectAll('.answerToggle').style('visibility','hidden');
	if (params.answersParagraphnames.para.includes(params.cleanString(params.paragraphname))) {
		d3.select('#paraVersionOptions').selectAll('.answerToggle').style('visibility','visible');
	}
	if (params.answersParagraphnames.SDC.includes(params.cleanString(params.paragraphname)) && (params.paraSubmitted2 || params.haveSDCEditor)) {
		d3.select('#SDCVersionOptions').selectAll('.answerToggle').style('visibility','visible');
	}
}

function addEmptyAnswers(name){
	params.answers.push({'paragraphname':params.cleanString(name), 'task':'para'});
	params.answers.push({'paragraphname':params.cleanString(name), 'task':'SDC'});
	params.answersParagraphnames['para'].push(params.cleanString(name));
	params.answersParagraphnames['SDC'].push(params.cleanString(name));
}

function createEmail(){
	//if we want to send an email, this could be a way to start one for the user
	var url = window.location.href;

	window.location.href = "mailto:?subject=CHiMaD%20Form%20Entries&body=Thank%20you%20for%20submitting%20your%20responses.%20%20For%20your%20convenience,%20you%20can%20follow%20this%20link%20to%20a%20pre-populated%20form%20with%20your%20answers:%0A%0A"+url;
}

function toCustomize(){
	var url = window.location.href.replace('editPara','editSDC');
	window.location.href = url;
}