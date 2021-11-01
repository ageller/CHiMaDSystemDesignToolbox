//add edit button
// var parentEl = document.getElementById('paraForm');
// var btn = document.createElement('button');
// btn.className = 'secondaryButton';
// btn.id = 'paraEditButton';
// btn.textContent = 'edit';
// btn.style = 'margin-bottom:10px;'
// btn.onclick = beginParaEdit;
// parentEl.insertBefore(btn, document.getElementById('paraText'));

//add save button (and hide it)
// btn2 = document.createElement('button');
// btn2.className = 'secondaryButton';
// btn2.id = 'paraSaveButton';
// btn2.textContent = 'save';
// btn2.style = 'margin-bottom:10px; display:none;'
// btn2.onclick = saveParaEdit;
// parentEl.insertBefore(btn2, document.getElementById('paraText'));

//attach function to buttons and input
d3.select('#groupnameInput').on("keyup",getGroupnameInput);
document.getElementById('paraEditButton').onclick = beginParaEdit;
document.getElementById('paraSaveButton').onclick = saveParaEdit;
params.haveParaEditor = true;

//should I do this, or do I want to read in all the answers from the form first (once that is set up)?
//for now I will populate from URL
//populateAnswersFromURL();

//use the URL data if it exists to define the answers
function populateAnswersFromURL(){
	readURLdata();
	var keys = Object.keys(params.URLInputValues);
	var aPara= {}
	var aSDC = {}
	keys.forEach(function(k){
		if (k.substring(0,3) == 'SDC'){
			//not sure if this is correct
			var startWords = k.substring(3,k.length);
			var endWords = decodeURI(params.URLInputValues[k]).split(' ');
			var blanks = getAllIndices(endWords,"");
			blanks.forEach(function(b){endWords.splice(b, 1)});
			aSDC[startWords] = endWords
		} else {
			aPara[k] = decodeURI(params.URLInputValues[k])
		}
	});

	params.answers.forEach(function(a){
		if (params.cleanString(a.groupname) == params.cleanString(params.groupname)){
			if (a.task == 'para'){
				Object.keys(aPara).forEach(function(k){
					a[k] = aPara[k];
				})
			}
			if (a.task == 'SDC'){
				Object.keys(aSDC).forEach(function(k){
					a[k] = aSDC[k];
				})
			}
		}
	})

	params.answersGroupnames = [params.cleanString(params.groupname)];

}

function beginParaEdit(){
	console.log('editing paragraph');

	//reset the URL
	resetURLdata();

	//reset the notification
	d3.select('#groupnameNotification').text('');

	//remove the group name
	document.getElementById('groupnameInput').value = '';

	//change button to save
	d3.select('#paraEditButton').style('display','none');
	d3.select('#paraSaveButton').style('display','block');

	//populate the editor
	var txtarea = d3.select('#paraTextEditor').select('textarea');
	var height = Math.max(100., d3.select('#paraText').node().getBoundingClientRect().height);
	txtarea.style('height',height + 'px');
	//txtarea.node().value = params.paraTextSave;
	txtarea.text(params.paraTextSave);


	//hide the current paragraph and show the editor
	d3.select('#paraText').style('display','none');
	d3.select('#paraTextEditor').style('display','block');

	resize();


}

function saveParaEdit(){
	console.log('saving paragraph');

	//get the available tabs in the Google sheet
	//loadFile(params.paragraphFile, compileParagraphData);  //in case another edit was made by another user (but will this complete in time for the following if statement??)

	//check that the group name is not already used
	if (params.availableGroupnames.includes(params.cleanString(params.groupname)) || params.groupname == ''){
		d3.select('#groupnameNotification')
			.classed('error', true)
			.text('Please choose a different group name.  ');
	} else {
		
		//change button to save
		d3.select('#paraEditButton').style('display','block');
		d3.select('#paraSaveButton').style('display','none');

		//populate the paragraph and convert the paragraph to html markup (this also updates params.paraTextSave)
		var newText = d3.select('#paraTextEditor').select('textarea').node().value;
		updatePara(newText);

		//update the selection words list
		getSelectionWords();

		//define the dropdowns
		createDropdowns();

		//create the new tab in the google sheet
		var data = {'SHEET_NAME':params.cleanString(params.groupname), 'header':['Timestamp','IP','username','version', 'task']};
		params.selectionWords.forEach(function(d){
			data.header.push(params.cleanString(d));
		})
		sendResponsesToFlask(data, 'groupnameNotification', false, 'Paragraph updated successfully.');

		//add to the paragraphs tab in the google sheet (answers will come later with the onAnswersSubmit)
		data =  {'SHEET_NAME':'paragraphs', 'groupname':params.groupnameOrg,'paragraph':newText,'answersJSON':''};
		params.nTrials = 0; //this may not work properly since I have a submit up above...
		sendResponsesToFlask(data, 'groupnameNotification', false, 'Paragraph updated successfully.');

		//hide the editor and show the current paragraph
		d3.select('#paraText').style('display','block');
		d3.select('#paraTextEditor').style('display','none');

		//create blank entries for the answers
		addEmptyAnswers(params.cleanString(params.groupname));

		//show the system design chart starter
		createSystemDesignChart();
	} 
}

function onAnswersSubmit(){
	params.nTrials = 0;
	d3.select('#answerSubmitNotification')
		.classed('blink_me', true)
		.classed('error', false)
		.text('Processing...');


	var answersData = [];
	params.answers.forEach(function(a){
		if (params.cleanString(a.groupname) == params.cleanString(params.groupname)) answersData.push(a);
	})
	var data =  {'SHEET_NAME':'paragraphs', 'groupname':params.groupnameOrg,'paragraph':params.paraTextSave, 'answersJSON':JSON.stringify(answersData)}
	sendResponsesToFlask(data, 'answerSubmitNotification', false, 'Answers updated successfully.');
	console.log('answers submitted', data);
}

function getGroupnameInput(groupname=null, evnt=null){
	//get the group data from the text input box to define the paragraph

	if (this.value) groupname = this.value;

	//this will handle the write-in groupname for the editor
	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {

		params.groupnameOrg = groupname;
		params.groupname = params.cleanString(groupname);
		if (!(typeof params.groupname === 'string') && !(params.groupname instanceof String)) params.groupname = '';

		console.log('groupname ', params.groupname);
		if (params.availableGroupnames.includes(params.groupname) || params.groupname == '') {
			d3.select('#groupnameNotification')
				.classed('error', true)
				.text('Please choose a different group name. ');
		} else {
			d3.select('#groupnameNotification').text('');
			params.URLInputValues["groupname"] = params.groupname;
			appendURLdata();
		}
	}
}
