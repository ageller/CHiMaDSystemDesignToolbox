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
d3.select('#paragraphnameInput').on("keyup",getParagraphnameInput);
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
		if (params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname)){
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

	params.answersParagraphnames = [params.cleanString(params.paragraphname)];

}

function beginParaEdit(){
	console.log('editing paragraph');
	params.edittingPara = true;

	//reset the URL
	resetURLdata();

	//reset the notification
	d3.select('#paragraphnameNotification').text('');

	//remove the paragraph name
	document.getElementById('paragraphnameInput').value = '';

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
	params.edittingPara = false;
	d3.select('#answerSubmitNotification')
		.classed('blink_me', false)
		.classed('error', false)
		.text('');

	//check that the paragraph name is not already used
	if (params.availableParagraphnames.includes(params.cleanString(params.paragraphname)) || params.paragraphname == ''){
		d3.select('#paragraphnameNotification')
			.classed('error', true)
			.text('Please choose a different paragraph name.  ');
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

		//create the new table in the database
		var data = {'TABLE_NAME':params.cleanString(params.paragraphname), 'header':['Timestamp','IP','username','version', 'task']};
		params.selectionWords.forEach(function(d){
			data.header.push(params.cleanString(d));
		})
		sendResponsesToFlask(data, 'paragraphnameNotification', false, 'Paragraph updated successfully.');

		//add to the paragraphs table in the database (answers will come later with the onAnswersSubmit)
		data = {'TABLE_NAME':'paragraphs', 'paragraphname':params.paragraphnameOrg,'paragraph':newText,'answersJSON':''};
		params.nTrials = 0; //this may not work properly since I have a submit up above...
		sendResponsesToFlask(data, 'paragraphnameNotification', false, 'Paragraph updated successfully.');

		//hide the editor and show the current paragraph
		d3.select('#paraText').style('display','block');
		d3.select('#paraTextEditor').style('display','none');

		//create blank entries for the answers
		addEmptyAnswers(params.cleanString(params.paragraphname));

		//show the system design chart starter
		createSystemDesignChart();
	} 
}

function onAnswersSubmit(){
	if (params.edittingPara){
		d3.select('#answerSubmitNotification')
			.classed('blink_me', false)
			.classed('error', true)
			.text('Please save the paragraph before submitting the answers.');
	} else {
		params.nTrials = 0;
		d3.select('#answerSubmitNotification')
			.classed('blink_me', true)
			.classed('error', false)
			.text('Processing...');


		var answersData = [];
		params.answers.forEach(function(a){
			if (params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname)) answersData.push(a);
		})
		var data = {'TABLE_NAME':'paragraphs', 'paragraphname':params.paragraphnameOrg,'paragraph':params.paraTextSave, 'answersJSON':JSON.stringify(answersData)}
		sendResponsesToFlask(data, 'answerSubmitNotification', false, 'Answers updated successfully.');
		console.log('answers submitted', data);
	}
}

function getParagraphnameInput(paragraphname=null, evnt=null){
	//get the paragraph data from the text input box to define the paragraph

	if (this.value) paragraphname = this.value;

	//this will handle the write-in paragraphname for the editor
	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {

		params.paragraphnameOrg = paragraphname;
		params.paragraphname = params.cleanString(paragraphname);
		if (!(typeof params.paragraphname === 'string') && !(params.paragraphname instanceof String)) params.paragraphname = '';

		console.log('paragraphname ', params.paragraphname);
		if (params.availableParagraphnames.includes(params.paragraphname) || params.paragraphname == '') {
			d3.select('#paragraphnameNotification')
				.classed('error', true)
				.text('Please choose a different paragraph name. ');
		} else {
			d3.select('#paragraphnameNotification').text('');
			params.URLInputValues["paragraphname"] = params.paragraphname;
			appendURLdata();
		}
	}
}
