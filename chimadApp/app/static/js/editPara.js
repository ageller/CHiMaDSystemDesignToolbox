
//attach function to buttons and input
//d3.select('#paragraphnameInput').on("keyup",getParagraphnameInput);
document.getElementById('paraEditButton').onclick = beginParaEdit;
document.getElementById('paraCancelButton').onclick = cancelParaEdit;
document.getElementById('paraSaveButton').onclick = saveParaEdit;
document.getElementById('paraSaveAsButton').onclick = saveAsParaEdit;

params.haveParaEditor = true;

//should I do this, or do I want to read in all the answers from the form first (once that is set up)?
//for now I will populate from URL

//use the URL data if it exists to define the answers
function populateAnswersFromURL(){
	var haveSDCAnswers = false;
	var haveParaAnswers = false;

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
			aSDC[startWords] = lowerArray(endWords);
		} else {
			aPara[k] = decodeURI(params.URLInputValues[k]).toLowerCase();
		}
	});

	params.answers.forEach(function(a){
		if (params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname)){
			if (a.task == 'para'){
				Object.keys(aPara).forEach(function(k){
					if (a[k] != aPara[k]) haveParaAnswers = true;
					a[k] = aPara[k];
				})
			}
			if (a.task == 'SDC'){
				Object.keys(aSDC).forEach(function(k){
					if (a[k] != aSDC[k]) haveSDCAnswers = true;
					a[k] = aSDC[k];
				})
			}
		}
	})

	console.log('checking', haveParaAnswers, aPara)
	if (haveParaAnswers){
		params.userModified = true;
		if (Array.isArray(params.answersParagraphnames.para)){
			if (params.answersParagraphnames.para.includes(params.cleanString(params.paragraphname))) params.answersParagraphnames.para.push(params.cleanString(params.paragraphname))
		} else {
			params.answersParagraphnames.para = [params.cleanString(params.paragraphname)];
		}
	}
	if (haveSDCAnswers){
		params.userModified = true;
		if (Array.isArray(params.answersParagraphnames.SDC)){
			if (params.answersParagraphnames.SDC.includes(params.cleanString(params.paragraphname))) params.answersParagraphnames.SDC.push(params.cleanString(params.paragraphname))
		} else {
			params.answersParagraphnames.SDC = [params.cleanString(params.paragraphname)];
		}
	}
}


function beginParaEdit(){
	params.paragraphnameOrgPrev = params.paragraphnameOrg;

	var cleanGroupnames = []
	params.availableGroupnames.forEach(function(d){cleanGroupnames.push(params.cleanString(d));})


	if (params.groupname != 'default' && (params.availableGroupnames.includes(params.groupname) || cleanGroupnames.includes(params.cleanString(params.groupname)))){

		console.log('editing paragraph');
		params.editingPara = true;
		params.replacePara = true;
		params.userModified = true;
		params.userSubmitted = false;

		//reset the URL
		resetURLdata(['groupname']);

		//reset the notification
		d3.select('#paragraphnameNotification').text('').classed('error', false);

		//remove the paragraph name
		document.getElementById('paragraphnameInput').value = '';

		//change button to save
		d3.select('#paraEditButton').style('display','none');
		d3.select('#paraSaveButtons').style('display','block');

		//populate the editor
		var txtarea = d3.select('#paraTextEditor').select('textarea');
		var height = Math.max(100., d3.select('#paraText').node().getBoundingClientRect().height);
		txtarea.style('height',height + 'px');
		//txtarea.node().value = params.paraTextSave;
		txtarea.text(params.paraTextSave);
		txtarea.node().value = params.paraTextSave;


		//hide the current paragraph and show the editor
		d3.select('#paraText').style('display','none');
		d3.select('#paraTextEditor').style('display','block');

		resize();
		

	} else {
		d3.select('#paragraphnameNotification')
			.classed('error', true)
			.text('Please login first');
	}

}

function cancelParaEdit(){
	console.log('cancelled by user. reverting to ', params.paragraphnameOrgPrev)

	//revert to the previous paragraph
	setParagraphnameFromOptions(params.cleanString(params.paragraphnameOrgPrev));

	//hide the editor and show the current paragraph
	d3.select('#paraText').style('display','block');
	d3.select('#paraTextEditor').style('display','none');

	//revert the buttons
	d3.select('#paraEditButton').style('display','block');
	d3.select('#paraSaveButtons').style('display','none');

	params.replacePara = false;
	params.editingPara = false;
	params.userModified = false;

}

function saveAsParaEdit(){
	params.paragraphnameOrgPrev = params.paragraphnameOrg;

	var cleanGroupnames = []
	params.availableGroupnames.forEach(function(d){cleanGroupnames.push(params.cleanString(d));})

	if (params.groupname != 'default' && (params.availableGroupnames.includes(params.groupname) || cleanGroupnames.includes(params.cleanString(params.groupname)))){

		// check the name input
		var good = getParagraphnameInput('paragraphnameInput','paragraphnameNotification');

		if (good){

			console.log('creating new paragraph');
			params.editingPara = true;
			params.replacePara = false;
			params.userModified = true;
			params.userSubmitted = false;

			//reset the URL
			resetURLdata(['groupname']);

			//reset the notification
			d3.select('#paragraphnameNotification').text('').classed('error', false);

			saveParaEdit();

		}
	} else {
		d3.select('#paragraphnameNotification')
			.classed('error', true)
			.text('Please login first');
	}

}

function saveParaEdit(){

	let proceed = true;

	if (params.replacePara){
		var proceedText = 'You are about to replace paragraph  "' + params.paragraphnameOrg +'".  This will delete all previously saved answers and responses related to this paragraph.  This action cannot be undone.';
		proceed = confirm(proceedText);
		console.log(proceed);
	}

	if (proceed){

		params.pagraphnameOrgPrev = params.paragraphnameOrg;

		console.log('saving paragraph');

		d3.select('#answerSubmitNotification')
			.classed('blink_me', false)
			.classed('error', false)
			.text('');

		//change button to save
		d3.select('#paraEditButton').style('display','block');
		d3.select('#paraSaveButtons').style('display','none');

		//populate the paragraph and convert the paragraph to html markup (this also updates params.paraTextSave)
		var newText = d3.select('#paraTextEditor').select('textarea').node().value;
		updatePara(newText);

		//update the selection words list
		getSelectionWords();

		//define the dropdowns
		createDropdowns();

		//create the new table in the database
		var out = {'tablename':params.cleanString(params.paragraphname), 'dbname':params.dbname, 'replace':params.replacePara}
		out.data = {'header':['Timestamp','IP','username','version', 'task']};
		params.selectionWords.forEach(function(d){
			out.data.header.push(params.cleanString(d));
		})
		sendResponsesToFlask(out, 'paragraphnameNotification', false, 'Paragraph updated successfully.','Responses failed to be submitted. Please refresh your browser and try again.' );

		//add to the paragraphs table in the database (answers will come later with the onAnswersSubmit)
		out = {'tablename':'paragraphs', 'dbname':params.dbname, 'replace':params.replacePara}
		out.data = {'paragraphname':params.paragraphname,'paragraph':newText,'answersJSON':''};
		params.nTrials = 0; //this may not work properly since I have a submit up above...
		//this will also update the local paragraphs and answers objects and redraw the SDC
		sendResponsesToFlask(out, 'paragraphnameNotification', false, 'Paragraph updated successfully.', 'Responses failed to be submitted. Please refresh your browser and try again.', true);

		//hide the editor and show the current paragraph
		d3.select('#paraText').style('display','block');
		d3.select('#paraTextEditor').style('display','none');



	}

	params.editingPara = false;
	params.replacePara = false;
	params.userModified = false;
	params.userSubmitted = true;
}

function onAnswersSubmit(){
	if (params.groupname != 'default' && params.availableGroupnames.includes(params.groupname)){
		if (params.editingPara){
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
			var out = {'tablename':'paragraphs', 'dbname':params.dbname}
			out.data = {'paragraphname':params.paragraphname,'paragraph':params.paraTextSave, 'answersJSON':JSON.stringify(answersData)}
			sendResponsesToFlask(out, 'answerSubmitNotification', false, 'Answers updated successfully.', 'Answers failed to be submitted. Please refresh your browser and try again.', true);;
			console.log('answers submitted', out);
			params.userModified = false;
			params.userSubmitted = true;
		}
	} else {
		d3.select('#answerSubmitNotification')
			.classed('blink_me', false)
			.classed('error', true)
			.text('Please login first.');
	}
}

function getParagraphnameInput(iden, notificationIden){
	//get the paragraph data from the text input box to define the paragraph

	var paragraphname = d3.select('#' + iden).property('value');
	var good = true;

	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {
		if (!(typeof paragraphname === 'string') && !(paragraphname instanceof String)) paragraphname = '';
		params.paragraphnameOrg = paragraphname;
		params.paragraphname = params.cleanString(paragraphname);

		console.log('paragraphname ', paragraphname);

		//check if name exists
		if (paragraphname == '') {
			d3.select('#' + notificationIden)
				.text('Please enter a paragraph name.')
				.classed('error', true)
			good = false
		}

		if (params.availableParagraphnames.includes(params.cleanString(paragraphname))) {
			d3.select('#' + notificationIden)
				.text('This paragraph name (or one too similar) is already in use.  Please enter a different paragraph name.')
				.classed('error', true)
			good = false
		} 

		if (good) {
			d3.select('#' + notificationIden)
				.text('')
				.classed('error', false);
			params.URLInputValues["paragraphname"] = params.paragraphname;
			appendURLdata();
		}

	}

	return good;
}
