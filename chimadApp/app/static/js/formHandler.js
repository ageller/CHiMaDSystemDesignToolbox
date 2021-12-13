function sendResponsesToFlask(out, notificationID, startInterval=true, successResponse=null, failResponse=null){

	if (!successResponse) successResponse = 'Responses submitted successfully.  The chart will update automatically when new data are available.  You can change your responses anytime by re-submitting.';
	if (!failResponse) failResponse = 'Responses failed to be submitted.  Please refresh your browser and try again.'

	d3.selectAll('.error').classed('error', false);
	d3.selectAll('.errorBorder').classed('errorBorder', false);

	out.notificationID = notificationID
	out.startInterval = startInterval
	out.successResponse = successResponse
	out.failResponse = failResponse;

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
					loadTable(params.dbname, params.surveyTable, aggregateResults);

					clearInterval(params.loadInterval);
					params.loadInterval = setInterval(function(){
						loadTable(params.dbname, params.surveyTable, aggregateResults);
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

function sendMetricsToFlask(){

	var out = {'data':params.metrics, 'dbname':'CHiMaD_metrics.db', 'tablename':'loginMetrics'};

	console.log('sending metrics to Flask', out);

	//send to flask
	$.ajax({
			url: '/save_metrics',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				console.log('metrics saved',d);
			},
			error: function(d) {
				console.log('!!! WARNING: metrics did not save', d);
			}
		});

}
function onParaSubmit(){
	//when form is submitted, compile responses and send the flask

	console.log('username',params.username);
	var submitted1 = params.paraSubmitted;
	params.paraSubmitted = false;

	var paraData = {};
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
					paraData[id] = this.value;
				} 
				if (this.selected && this.disabled){
					missing.push(id);
				} 
			})
		});

		//add the IP, username and task (not using IP anymore)
		paraData['IP'] = params.userIP;
		paraData['username'] = params.username;
		paraData['task'] = 'para';
		if (missing.length == 0){
			console.log("form data", paraData);
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
			var out = {'tablename':params.cleanString(params.paragraphname), 'dbname':params.dbname};
			out.data = paraData;

			//send to flask -- this will then return to start the load interval
			sendResponsesToFlask(out, 'paraNotification');

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

	SDCData = {};
	//add the IP, username and task (not using IP anymore)
	SDCData['IP'] = params.userIP;
	SDCData['username'] = params.username;
	SDCData['task'] = 'SDC';
	params.selectionWords.forEach(function(w,i){
		//initialize to empty
		SDCData[params.cleanString(w)] = '';
		if (i == params.selectionWords.length - 1){
			//gather all the data and combine into aggregated lists when necessary
			d3.selectAll('.SDCLine').each(function(d,j){
				var elem = d3.select(this)
				var word1 = elem.attr('startSelectionWords');
				var word2 = '';
				if (!SDCData[word1].includes(elem.attr('endSelectionWords'))){
					if (SDCData[word1] != '') word2 = ' ';
					word2 += elem.attr('endSelectionWords');
					SDCData[word1] += word2;
				}

				if (j == d3.selectAll('.SDCLine').size() - 1){
					//send to flask -- this will then return to start the load interval
					var out = {'tablename':params.cleanString(params.paragraphname),'dbname': params.dbname};
					out.data = SDCData;
					sendResponsesToFlask(out, 'SDCNotification');
					params.SDCSubmitted = true;
					console.log('submitted SDC form', out);
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
		if (params.groupname != '' && params.groupname != 'default') params.URLInputValues.groupname = params.groupname;
		params.URLInputValues.username = params.username;
		params.URLInputValues.paragraphname = params.cleanString(params.paragraphname);
		resetURLdata(['groupname','paragraphname', 'username']);
		console.log('username ', params.username, params.URLInputValues)

		var ub = d3.select('#usernameLabel').node();
		if (ub){
			var ubbox = d3.select('#usernameLabel').node().getBoundingClientRect();
			d3.select('#usernameNotification').text('');
		}

		//reset all the selection words dropdowns
		d3.selectAll('.selectionWord').select('select').selectAll('option').property('selected',false);
		d3.selectAll('.selectionWord').select('select').select('#disabled').property('selected',true);

		params.responses.forEach(function(d,i){
			if (decodeURI(d.username) == decodeURI(params.username)){

				console.log('found user in database', d.username, params.username, d)
				//show notification
				if (ub){
				d3.select('#usernameNotification')
					.text('This username exists, and the responses below have been populated accordingly.  If these are not your responses, please change your username.');
				}

				Object.keys(d).forEach(function(k){

					if (k != 'IP' && k != 'Timestamp' && k != 'version' && k !='task' && d[k] != '' && k != 'username' && k != 'date') {
						var key = k;
						if (d.task == 'SDC') key = 'SDC'+k;
						//console.log("testing", d, key, k, params.URLInputValues[key], d[k])
						if (d[k]) params.URLInputValues[key] = d[k].trim();
					}
				})

			}
			if (i == params.responses.length - 1){
				appendURLdata();
				//readURLdata();
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
	resetURLdata(['username','groupname']);

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

	params.haveSurveyData = false;
	loadTable(params.dbname, params.surveyTable, aggregateResults);

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


function toHome(){
	var fields = getURLFields();
	window.location.href = fields.urlStart + 'home' + fields.urlAddOn;
}
function toAbout(){
	var fields = getURLFields();
	window.location.href = fields.urlStart + 'about' + fields.urlAddOn;
}
function toCollaborate(){
	var fields = getURLFields();
	window.location.href = fields.urlStart + 'training' + fields.urlAddOn;
}
function toIndividual(){
	var fields = getURLFields();
	window.location.href = fields.urlStart + 'editPara' + fields.urlAddOn;
}
function toCustomize(){
	var fields = getURLFields();
	window.location.href = fields.urlStart + 'editSDC' + fields.urlAddOn;
}

function changeGroupname(){
	document.getElementById('login').style.display = 'block';
}



function closeGroupnameInput(){
	document.getElementById('login').style.display = 'none';
}

function setGroupname(val){
	document.getElementById('groupnameID').innerHTML = val;
	params.URLInputValues.groupname = val;
	params.groupname = params.cleanString(val);
	appendURLdata();
	params.dbname = params.groupname + '.db';
}

function login(){
	//check the required groupname
	var val = document.getElementById('groupnameInput').value;
	if (params.availableGroupnames.includes(val)){
		params.URLInputValues = {};
		setGroupname(val);
		document.getElementById('groupnameNotification').style.visibility = 'hidden';
		closeGroupnameInput();

		console.log('===== groupname : ', params.groupname);

		//need to get the paragraph names
		getTableNames(selectTableAndLoad);


		//gather other metrics
		params.metrics = {};
		params.metrics.name = document.getElementById('metricNameInput').value;
		params.metrics.organization = document.getElementById('metricOrgInput').value;
		params.metrics.email = document.getElementById('metricEmailInput').value;
		params.metrics.purpose = document.getElementById('metricPurposeSelect').value;
		params.metrics.groupname = params.groupname;
		console.log('===== metrics : ', params.metrics)

		sendMetricsToFlask();

		if (params.inCollaborate){
			d3.select('#usernameNotification').text('');
			d3.select('#usernameInput').node().value = '';
		}

		if (params.haveParaEditor){
			d3.select('#paragraphnameNotification').text('').classed('error', false);
			d3.select('#answerSubmitNotification')
				.classed('blink_me', false)
				.classed('error', false)
				.text('Please click the Submit button above when you have completed your work.');
		}

	} else {
		document.getElementById('groupnameNotification').style.visibility = 'visible';
	}



}

function selectTableAndLoad(tables){
	console.log('have tables', tables)
	params.paragraphname = tables.filter(function(d){return d != 'paragraphs'})[0]
	params.paragraphnameOrg = params.paragraphname;
	params.surveyTable = params.paragraphname;
	params.paragraphTable = 'paragraphs';
	params.dbname = params.groupname + '.db';

	if (params.haveBars || params.haveSDC) loadAndInit();

}

function logout(){
	document.getElementById('login').style.display = 'none';
	document.getElementById('groupnameID').innerHTML = 'click to login';

	params.URLInputValues = {}; 
	params.groupname = 'default';
	params.dbname = params.groupname + '.db';
	params.paragraphname = 'polymercompositeexample';
	params.paragraphnameOrg = 'Polymer Composite Example';
	params.surveyTable = params.paragraphname;
	params.paragraphTable = 'paragraphs';

	resetURLdata();

	//reload with the default values
	if (params.haveBars || params.haveSDC) loadAndInit();

	//could call toggleDropdown, but I'd like to use logout elsewhere when dropdown may not be open yet
	var drop = d3.select('#dropdown');
	drop.classed('active', false);
	setTimeout(function(){drop.style('visibility', 'hidden');},300);

}

function toggleDropdown(id){
	var drop = document.getElementById(id);

	drop.classList.toggle("active");
	if (drop.style.visibility == "visible" ){
		setTimeout(function(){drop.style.visibility = "hidden";},300);
	} else {
		drop.style.visibility = "visible";
	}

}

//for the login button
var input = document.getElementById('groupnameInput');
if (input){
	input.addEventListener('keyup', function(event) {
		document.getElementById('groupnameNotification').style.visibility = 'hidden';
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById('groupnameSubmit').click();
		}
	});
}