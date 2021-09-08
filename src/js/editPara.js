//add edit button
var parentEl = document.getElementById('paraForm');
var btn = document.createElement('button');
btn.className = 'secondaryButton';
btn.id = 'paraEditButton';
btn.textContent = 'edit';
btn.style = 'margin-bottom:10px;'
btn.onclick = beginParaEdit;
parentEl.insertBefore(btn, document.getElementById('paraText'));

//add save button (and hide it)
btn2 = document.createElement('button');
btn2.className = 'secondaryButton';
btn2.id = 'paraSaveButton';
btn2.textContent = 'save';
btn2.style = 'margin-bottom:10px; display:none;'
btn2.onclick = saveParaEdit;
parentEl.insertBefore(btn2, document.getElementById('paraText'));

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
	txtarea.style('height',d3.select('#paraText').node().getBoundingClientRect().height);
	txtarea.node().value = params.paraTextSave;


	//hide the current paragraph and show the editor
	d3.select('#paraText').style('display','none');
	d3.select('#paraTextEditor').style('display','block');


}

function saveParaEdit(){
	console.log('saving paragraph');

	//get the available tabs in the Google sheet
	loadResponses(params.sheetRequest); //in case another edit was made by another user (but will this complete in time for the following if statement??)
	//check that the group name is not already used
	if (params.availableGroupnames.includes(params.groupname) || params.groupname == ''){
		d3.select('#groupnameNotification')
			.classed('error', true)
			.text('Please choose a different group name.  ');
	} else {
		
		//change button to save
		d3.select('#paraEditButton').style('display','block');
		d3.select('#paraSaveButton').style('display','none');

		//populate the paragraph
		var newText = d3.select('#paraTextEditor').select('textarea').node().value;
		console.log('have new text:',newText);
		d3.select('#paraText').html(newText);

		//now convert the paragraph to html markup (this also updates params.paraTextSave)
		convertPara();

		//update the selection words list
		getSelectionWords();

		//define the dropdowns
		createDropdowns();

		//update the google sheet
		var data = {'SHEET_NAME':params.groupname, 'header':['Timestamp','IP','username','version', 'task']}
		params.selectionWords.forEach(function(d){
			data.header.push(d);
		})
		sendToGoogleSheet(data, 'groupnameNotification', startInterval=false, succesResponse='Paragraph updated successfully.');

		//how will we deal with the answers?

		//hide the editor and show the current paragraph
		d3.select('#paraText').style('display','block');
		d3.select('#paraTextEditor').style('display','none');
	} 
}

