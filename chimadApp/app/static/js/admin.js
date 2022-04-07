params.haveAdmin = true;

params.admingroupname2 = null;
params.admindbname2 = null;
params.adminparagraphname2 = null;
params.adminParagraphRowForAnswers = null;

getGroupAdmins();

//resize events
window.addEventListener('resize', resize);
resize();

//bind the input getters
d3.select('#groupnameTextInput').on("keyup",function(){getGroupnameInput('groupnameTextInput','groupnameNotification');});
d3.select('#renameGroupnameTextInput').on("keyup",function(){getGroupnameInput('renameGroupnameTextInput','renameGroupnameNotification');});
d3.select('#renameParagraphTextInput').on("keyup",function(){getParagraphnameInput('renameParagraphTextInput','renameParagraphNotification');});


// there are types of admins: global and restricted
// - global gets all the options
// - restricted only has access to admin function associated with the specific groupname, which is params.adminGroup
console.log('admin : ', params.adminGroup, params.adminLevel);
function setAdminLevel(){
	if (params.adminLevel != 'global'){
		params.groupname = params.adminGroup;
		d3.select('#addGroupname').style('display','none');
		d3.select('#groupnameSelector').style('display','none');
		d3.select('#copyParagraph').style('display','none');
		d3.select('#downloadMetrics').style('display','none');

		d3.select('#groupnameSelectInstructions').text('To edit your group (' + params.groupname + '), use the buttons below.');
		d3.select('#editGroupnameButtons').style('display','none');

		setGroupname(params.groupname);
		getTableNames(selectTableAndLoad);
	}
}

//get the available groupnames
function adminCallbackRename(data){
	compileAvailableGroupnames(data);
	createGroupnameSelect();
	d3.select('#renameGroupnameTextInput').property('value','')
}

function adminCallback(data){
	compileAvailableGroupnames(data);
	createGroupnameSelect();
	resetAdminNotifications();
	setAdminLevel();

}
function initAdmin(){
	loadTable('available_dbs.db', 'dbs', adminCallback);
	resetAdminNotifications();
	setAdminLevel();
}
initAdmin();

function resetAdminNotifications(groupDisplay = 'none', paraDisplay = 'none', para2Display = 'none'){
	if (groupDisplay) d3.select('#editGroupnameButtons').style('display',groupDisplay);
	d3.select('#deleteGroupnameNotification').text('').classed('error', false)
	d3.select('#renameGroupnameNotification').text('').classed('error', false)
	d3.select('#renameGroupnameTextInput').property('value','')
	d3.select('#groupnameTextInput').property('value','')

	if (paraDisplay) d3.select('#editParagraphButtons').style('display',paraDisplay);
	d3.select('#deleteParagraphNotification').text('').classed('error', false)
	d3.select('#renameParagraphNotification').text('').classed('error', false)
	d3.select('#deleteParagraphRowsNotification').text('').classed('error', false);
	d3.select('#renameParagraphTextInput').property('value','')
	d3.select('#paragraphTextInput').property('value','')

	if (para2Display) d3.select('#copyParagraphSelectors').style('display',para2Display);
	d3.select('#copyParagraphButton').style('display','none');
	d3.select('#copyParagraphNotification').text('').classed('error', false);
	d3.select('#selectParagraph2Notification').text('').classed('error', false)


}

function initGroupnameAdmin(){
	console.log('initGroupnameAdmin', params.groupname)
	loadTable(params.dbname, params.paragraphTable, compileParagraphData); 
	if (params.availableParagraphnames.length > 0){
		updateSurveyTable();	
		loadTable(params.dbname, params.surveyTable, aggregateResults);
	}
	if (params.admins.includes(params.groupname)){
		console.log('this group has admin access.');
		// button to remove admin access
		// button to change password  
		d3.select('#enableGroupAdmin').style('display','none');
		if (params.adminLevel == 'global') d3.select('#disableGroupAdmin').style('display','block');
		d3.select('#setGroupAdminPW').style('display','block');
	} else {
		console.log('this group does not have admin access.');
		// button to add admin access and set password
		if (params.adminLevel == 'global') d3.select('#enableGroupAdmin').style('display','block');
		d3.select('#disableGroupAdmin').style('display','none');
		d3.select('#setGroupAdminPW').style('display','none');
	}
	resetAdminNotifications('block');
}

function initParagraphnameAdmin(data){
	loadTable(params.dbname, params.paragraphTable, compileParagraphData); 
	if (data.newname){
		params.paragraphname = params.cleanString(data.newname);
		console.log('setting paragraphname', params.paragraphname);
		updateSurveyTable();
		loadTable(params.dbname, params.surveyTable, adminParaSelectCallback);
	}
	resetAdminNotifications('block', 'block')
}

function adminParaSelect(){
	params.paragraphname = params.cleanString(this.value);
	console.log('setting paragraphname', params.paragraphname);
	updateSurveyTable();
	loadTable(params.dbname, params.surveyTable, adminParaSelectCallback);
	resetAdminNotifications('block', 'block')
}

function adminParaSelectCallback(data){
	console.log('have para data', data)
	//create the table
	params.adminParagraphRowsToRemove = [];
	params.adminParagraphData = data;
	params.adminParagraphData.columns.unshift('index')
	params.adminParagraphData.forEach(function(d,i){d.index = i})
	var tab = makeParagraphTable(params.adminParagraphData, d3.select('#paragraphTableEditor'))
}

function createGroupnameSelect(){
	//create the groupname dropdown (for admin)
	d3.select('#groupnameSelector').selectAll('label').remove();
	d3.select('#groupnameSelector').selectAll('select').remove();

	d3.select('#groupnameSelector').append('label')
		.attr('for','groupnameSelect')
		.html('group name: ')

	var slct = d3.select('#groupnameSelector').append('select')
		.attr('id','groupnameSelect')
		.attr('name','groupnameSelect')
		.on('change',function(){
			setGroupname(this.value);
			getTableNames(selectTableAndLoad);
			createGroupname2Select();
		})


	var opts = params.availableGroupnames.slice();
	opts.unshift('Select from list')
	slct.selectAll('option').data(opts).enter().append('option')
		.attr('id',function(d){return 'groupname'+params.cleanString(d);})
		.attr('value',function(d){return d;})
		.text(function(d){return d;})

	slct.select('#groupnameselectfromlist')
		.property('disabled', true)
		.property('selected', true)

	// var index = -1;
	// params.availableParagraphnamesOrg.filter(function(d){return d != 'paragraphs'}).forEach(function(d,i){
	// 	if (params.cleanString(d) == params.cleanString(params.paragraphname)) index = i;
	// })
	// slct.node().selectedIndex = index;
}

function createGroupname2Select(){
	//create the groupname dropdown for the second groupname (for admin copying paragraphs)
	d3.select('#groupname2Selector').selectAll('label').remove();
	d3.select('#groupname2Selector').selectAll('select').remove();

	d3.select('#groupname2Selector').append('label')
		.attr('for','groupname2Select')
		.html('second group name: ')

	var slct = d3.select('#groupname2Selector').append('select')
		.attr('id','groupname2Select')
		.attr('name','groupname2Select')
		.on('change',function(){
			params.admingroupname2 = this.value;
			params.admindbname2 = params.admingroupname2 + '.db';
			getTableNames(callLoadTable2, params.admindbname2);
		})


	var opts = params.availableGroupnames.filter(function(d){
		if (d.toLowerCase() == params.groupname.toLowerCase()) return false;
		return true;
	}).slice();
	opts.unshift('Select from list')
	slct.selectAll('option').data(opts).enter().append('option')
		.attr('id',function(d){return 'admingroupname2'+params.cleanString(d);})
		.attr('value',function(d){return d;})
		.text(function(d){return d;})

	slct.select('#groupname2selectfromlist')
		.property('disabled', true)
		.property('selected', true)

}

function callLoadTable2(){
	loadTable(params.admindbname2, params.paragraphTable, compileParagraph2Data)
}

function compileParagraph2Data(data){
	//get the actual naems of the paragraphs

	var availableParagraphnames2 = [];
	var availableParagraphnamesOrg2 = [];
	data.forEach(function(d){
		availableParagraphnamesOrg2.push(d.paragraphname);
		availableParagraphnames2.push(params.cleanString(d.paragraphname));
	})

	createParagraphname2Select(availableParagraphnamesOrg2);
}


function createParagraphname2Select(tables){

	var paragraphnames2 = tables.filter(function(d){return d != 'paragraphs'})

	//but I actually want the full names, not the clean strings

	console.log('have paragraphnames2', paragraphnames2)


	d3.select('#copyParagraphSelectors').style('display','block');
	d3.select('#paragraphname2Selector').selectAll('label').remove();
	d3.select('#paragraphname2Selector').selectAll('select').remove();


	var slct = d3.select('#paragraphname2Selector').append('select')
		.attr('id','adminparagraphname2Select')
		.attr('name','adminparagraphname2Select')
		.on('change',setCopyParagraphText)

	//I need this
	var opts = paragraphnames2.slice();
	opts.unshift('Select from list')

	slct.selectAll('option').data(opts).enter().filter(function(d){return d != 'paragraphs'}).append('option')
		.attr('id',function(d){return 'adminparagraphname2'+params.cleanString(d);})
		.attr('value',function(d){return d;})
		.text(function(d){return d;})
	
	slct.select('#adminparagraphname2selectfromlist')
		.property('disabled', true)
		.property('selected', true)

}



function setCopyParagraphText(){

	params.adminparagraphname2 = this.value;
	d3.select('#copyParagraphButton').style('display','none');

	//check that this paragraph doesn't already exist in the original group
	d3.select('#selectParagraph2Notification').text('').classed('error', false);
	if (params.availableParagraphnames.includes(params.cleanString(params.adminparagraphname2))){
		d3.select('#selectParagraph2Notification')
			.text('Paragraph "' + params.adminparagraphname2 + '" already exists in group "' + params.groupname + '". Please select a different paragraph.')
			.classed('error', true);
	} else {

		d3.select('#copyParagraphButton').style('display','block');
		d3.select('#paragraph2text').text(params.adminparagraphname2);
		d3.select('#groupname2text').text(params.admingroupname2);
		d3.select('#groupname1text').text(params.groupname);
	}

}

function getGroupnameInput(iden, notificationIden){

	var groupname = d3.select('#' + iden).property('value');
	var good = true;

	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {
		if (!(typeof groupname === 'string') && !(groupname instanceof String)) groupname = '';


		console.log('groupname ', groupname);
		var cleanGroupnames = []
		params.availableGroupnames.forEach(function(d){cleanGroupnames.push(params.cleanString(d));})

		//check if groupname exists
		if (params.availableGroupnames.includes(groupname) || cleanGroupnames.includes(params.cleanString(groupname))){
			d3.select('#' + notificationIden)
				.text('This group name (or one too similar) is already in use.  Please enter a different group name.')
				.classed('error', true)
			good = false
		} 

		//check for spaces
		if (groupname.indexOf(' ') >= 0){
			d3.select('#' + notificationIden)
				.text('Group names must not contain any spaces or special characers.')
				.classed('error', true)
			good = false
		}

		if (good) {
			d3.select('#' + notificationIden)
				.text('')
				.classed('error', false)
		}

	}
}

function getParagraphnameInput(iden, notificationIden){

	var paragraphname = d3.select('#' + iden).property('value');
	var good = true;

	if (params.event.keyCode === 13 || params.event.which === 13) {
		//prevent returns from triggering anything
		event.preventDefault();
	} else {
		if (!(typeof paragraphname === 'string') && !(paragraphname instanceof String)) paragraphname = '';


		console.log('paragraphname ', paragraphname);

		//check if groupname exists
		if (params.availableParagraphnames.includes(params.cleanString(paragraphname))){
			d3.select('#' + notificationIden)
				.text('This paragraph name (or one too similar) is already in use.  Please enter a different paragraph name.')
				.classed('error', true)
			good = false
		} 

		if (good) {
			d3.select('#' + notificationIden)
				.text('')
				.classed('error', false)
		}

	}
}

function addGroupname(){

	if (params.adminLevel == 'global'){
		var groupname = d3.select('#groupnameTextInput').property('value');

		//get the text entry
		var out = {'groupname':groupname};

		console.log('Adding new groupname', out);

		//send to flask
		$.ajax({
			url: '/add_new_groupname',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {

				if (d.success){
					console.log('new group name added',d);
					loadTable('available_dbs.db', 'dbs', adminCallback);
					d3.select('#groupnameNotification')
						.text('The group was added sucessfully.')
						.classed('error', false)
				} else {
					d3.select('#groupnameNotification')
						.text('The group was not added.  Please enter a different group name a try again')
						.classed('error', true)
				} 
			},
			error: function(d) {
				console.log('!!! WARNING: could not add group name', d);
				//error message
				d3.select('#groupnameNotification')
					.text('The group was not added.  Please enter a different group name a try again')
					.classed('error', true)
			}
		});
	}
}

function deleteGroupname(){

	var good = true
	var groupname = params.groupname;
	// just in case (but should be the same as params.groupname)
	if (params.adminLevel == 'global') groupname = d3.select('#groupnameSelect').property('value');


	if (groupname == 'Select from list'){
		d3.select('#deleteGroupnameNotification')
			.text('Please select a group name first.')
			.classed('error', true);
		good = false;
	}

	if (good && params.groupname == 'default'){
		d3.select('#deleteGroupnameNotification')
			.text('You cannot delete the default group.')
			.classed('error', true);
		good = false;
	} 

	if (good) {
		console.log('deleting groupname', params.groupname);
		var proceedText = 'You are about to delete group "' + params.groupname +'".  This action cannot be undone.';
		if (params.adminLevel != 'global'){
			proceedText += '  If you click OK, you will be logged out, your group files will be deleted, and you will no longer have access to this admin site for this group.'
		}
		let proceed = confirm(proceedText);
		console.log(proceed);

		if (proceed){
			var out = {'groupname':params.groupname};

			//send to flask
			$.ajax({
				url: '/delete_groupname',
				contentType: 'application/json; charset=utf-8"',
				dataType: 'json',
				data: JSON.stringify(out),
				type: 'POST',
				success: function(d) {
					if (d.success){
						console.log('groupname deleted',d);
						if (params.adminLevel == 'global'){
							initAdmin();
						} else {
							setTimeout(adminLogout, 2000);
						}
						d3.select('#deleteGroupnameNotification')
							.text('Group was successfully deleted.')
							.classed('error', false)
					} else {
						d3.select('#deleteGroupnameNotification')
							.text('An error occured.  The group was not deleted.  Please try again')
							.classed('error', true)	
					}
	
				},
				error: function(d) {
					console.log('!!! WARNING: could not delete group name', d);
					//error message
					d3.select('#deleteGroupnameNotification')
						.text('An error occured.  The group was not deleted.  Please try again')
						.classed('error', true)
				}
			});

		} else{
			d3.select('#deleteGroupnameNotification')
				.text('Cancelled by user. The group was not deleted.')
				.classed('error', false)
		}
	}
}

function renameGroupname(){

	var good = true;
	var groupname = params.groupname;
	// just in case (but should be the same as params.groupname)
	if (params.adminLevel == 'global') groupname = d3.select('#groupnameSelect').property('value');

	if (groupname == 'Select from list'){
		d3.select('#renameGroupnameNotification')
			.text('Please select a group name first.')
			.classed('error', true);
		good = false;
	}

	if (good && params.groupname == 'default'){
		d3.select('#renameGroupnameNotification')
			.text('You cannot rename the default group.')
			.classed('error', true);
		good = false

	} 

	if (good) {
		var groupname = d3.select('#renameGroupnameTextInput').property('value')
		console.log('renaming groupname: current, new', params.groupname, groupname);

		var out = {'groupname':params.groupname, 'newname':groupname};

		//send to flask
		$.ajax({
			url: '/rename_groupname',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				if (d.success){
					console.log('groupname rename',d);
					setGroupname(groupname);
					loadTable('available_dbs.db', 'dbs', adminCallbackRename);
					d3.select('#renameGroupnameNotification')
						.text('Group was successfully renamed.')
						.classed('error', false)
				} else {
					d3.select('#renameGroupnameNotification')
						.text('An error occured.  The group was not renamed.  Please try again')
						.classed('error', true)	
				}

			},
			error: function(d) {
				console.log('!!! WARNING: could not rename group ', d);
				//error message
				d3.select('#renameGroupnameNotification')
					.text('An error occured.  The group was not renamed.  Please try again')
					.classed('error', true)
			}
		});


	}
}

function deleteParagraph(){

	var good = true
	var paragraphname = d3.select('#paragraphnameSelect').property('value');

	if (paragraphname == 'Select from list'){
		d3.select('#renameParagraphNotification')
			.text('Please select a paragraph first.')
			.classed('error', true);
		good = false;
	}


	if (good) {
		console.log('deleting paragraph', paragraphname);
		let proceed = confirm('You are about to delete paragraph "' + paragraphname +'".  This action cannot be undone.');
		console.log(proceed);

		if (proceed){
			//is this newname needed?  maybe for initParaphnameAdmin?? can't hurt to leave it
			newname = null;
			params.availableParagraphnames.every(function(d){
				if (d != params.cleanString(paragraphname)) newname = d;
				if (newname) return false;
				return true;
			})
			var out = {'paragraphname':paragraphname, 'groupname':params.groupname, 'newname':newname};

			//send to flask
			$.ajax({
				url: '/delete_paragraph',
				contentType: 'application/json; charset=utf-8"',
				dataType: 'json',
				data: JSON.stringify(out),
				type: 'POST',
				success: function(d) {
					if (d.success){
						console.log('paragraph deleted',d);
						initParagraphnameAdmin(d.data);
						d3.select('#deleteParagraphNotification')
							.text('Paragraph was successfully deleted.')
							.classed('error', false)
					} else {
						d3.select('#deleteParagraphNotification')
							.text('An error occured.  The paragraph was not deleted.  Please try again')
							.classed('error', true)	
					}
	
				},
				error: function(d) {
					console.log('!!! WARNING: could not delete paragraph', d);
					//error message
					d3.select('#deleteParagraphNotification')
						.text('An error occured.  The paragraph was not deleted.  Please try again')
						.classed('error', true)
				}
			});

		} else{
			d3.select('#deleteParagraphNotification')
				.text('Cancelled by user. The paragraph was not deleted.')
				.classed('error', false)
		}
	}
}

function renameParagraph(){

	var good = true;
	var paragraphname = d3.select('#paragraphnameSelect').property('value');
	if (paragraphname == 'Select from list'){
		d3.select('#renameParagraphNotification')
			.text('Please select a paragraph first.')
			.classed('error', true);
		good = false;
	}


	if (good) {
		var newname = d3.select('#renameParagraphTextInput').property('value')
		console.log('renaming paragraph: current, new', paragraphname, newname);

		var out = {'paragraphname':paragraphname, 'newname':newname, 'groupname':params.groupname};

		//send to flask
		$.ajax({
			url: '/rename_paragraph',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				if (d.success){
					console.log('paragraphname rename',d);
					initParagraphnameAdmin(d.data);

					d3.select('#renameParagraphNotification')
						.text('Paragraph was successfully renamed.')
						.classed('error', false)
				} else {
					d3.select('#renameParagraphNotification')
						.text('An error occured.  The group name was not renamed.  Please try again')
						.classed('error', true)	
				}

			},
			error: function(d) {
				console.log('!!! WARNING: could not rename group name', d);
				//error message
				d3.select('#renameParagraphNotification')
					.text('An error occured.  The group name was not renamed.  Please try again')
					.classed('error', true)
			}
		});


	}
}

function deleteParagraphRows(){

	var good = true
	var paragraphname = d3.select('#paragraphnameSelect').property('value');

	if (paragraphname == 'Select from list'){
		d3.select('#deleteParagraphRowsNotification')
			.text('Please select a paragraph first.')
			.classed('error', true);
		good = false;
	}

	if (params.adminParagraphRowsToRemove.length == 0){
		d3.select('#deleteParagraphRowsNotification')
			.text('You have not selected any rows for deletion.')
			.classed('error', true);
		good = false;
	}

	if (good) {
		console.log('deleting paragraph rows', paragraphname, params.adminParagraphRowsToRemove);
		let proceed = confirm('You are about to delete rows in paragraph "' + paragraphname +'".  This action cannot be undone.');
		console.log(proceed);

		if (proceed){
			//is this newname needed?  maybe for initParaphnameAdmin?? can't hurt to leave it
			newname = null;
			params.availableParagraphnames.every(function(d){
				if (d != params.cleanString(paragraphname)) newname = d;
				if (newname) return false;
				return true;
			})
			var out = {'paragraphname':paragraphname, 'newname':newname, 'groupname':params.groupname, 'rowsToRemove':params.adminParagraphRowsToRemove};

			//send to flask
			$.ajax({
				url: '/delete_paragraph_rows',
				contentType: 'application/json; charset=utf-8"',
				dataType: 'json',
				data: JSON.stringify(out),
				type: 'POST',
				success: function(d) {
					if (d.success){
						console.log('paragraph rows deleted',d);
						loadTable(params.dbname, params.surveyTable, adminParaSelectCallback);
						d3.select('#deleteParagraphRowsNotification')
							.text('Rows were successfully deleted.')
							.classed('error', false)
					} else {
						d3.select('#deleteParagraphRowsNotification')
							.text('An error occured.  The rows were not deleted.  Please try again')
							.classed('error', true)	
					}
	
				},
				error: function(d) {
					console.log('!!! WARNING: could not delete paragraph rows', d);
					//error message
					d3.select('#deleteParagraphRowsNotification')
						.text('An error occured.  The rows were not deleted.  Please try again')
						.classed('error', true)
				}
			});

		} else{
			d3.select('#deleteParagraphRowsNotification')
				.text('Cancelled by user. The rows were not deleted.')
				.classed('error', false)
		}
	}
}

function setParagraphAnswersFromRow(){

	var paragraphname = d3.select('#paragraphnameSelect').property('value');
	var uname = 'UNKNOWN';
	var task = 'UNKNOWN';

	if (params.adminParagraphRowForAnswers == null){
		d3.select('#setParagraphAnswersFromRowNotification')
			.text('Please select a row.')
			.classed('error', true);
	} else {
		d3.select('#setParagraphAnswersFromRowNotification').text('').classed('error', false);

		//get the username for the confirm text
		uname = params.adminParagraphData[params.adminParagraphRowForAnswers].username;
		task = params.adminParagraphData[params.adminParagraphRowForAnswers].task;

		console.log('setting paragraph answers', paragraphname, params.adminParagraphRowForAnswers);

		let proceed = confirm('You are about to set the answers for paragraph "' + paragraphname +'" from user "' + uname + '" for task "' + task + '" in group "' + params.groupname + '".  This action cannot be undone.');
		console.log(proceed);

		if (proceed){

			var out = {'paragraphname':paragraphname, 'groupname':params.groupname, 'rowForAnswers':params.adminParagraphRowForAnswers};

			//send to flask
			$.ajax({
				url: '/set_paragraph_answers',
				contentType: 'application/json; charset=utf-8"',
				dataType: 'json',
				data: JSON.stringify(out),
				type: 'POST',
				success: function(d) {
					if (d.success){
						console.log('paragraph answers set',d);
						loadTable(params.dbname, params.surveyTable, adminParaSelectCallback); //might not be necessary
						d3.select('#setParagraphAnswersFromRowNotification')
							.text('Answers were successfully set from selected row.')
							.classed('error', false)
					} else {
						d3.select('#setParagraphAnswersFromRowNotification')
							.text('An error occured.  The answers were not set.  Please try again')
							.classed('error', true)	
					}
	
				},
				error: function(d) {
					console.log('!!! WARNING: could not set paragraph answers', d);
					//error message
					d3.select('#setParagraphAnswersFromRowNotification')
						.text('An error occured.  The answers were not set.  Please try again')
						.classed('error', true)
				}
			});

		} else{
			d3.select('#setParagraphAnswersFromRowNotification')
				.text('Cancelled by user. The answers were not changed.')
				.classed('error', false)
		}	}
}

function copyParagraph(){


	if (params.adminLevel == 'global'){

		// in case they click the button a second time without changing anything else
		d3.select('#copyParagraphNotification').text('').classed('error',false)
		d3.select('#selectParagraph2Notification').text('').classed('error', false);
		if (params.availableParagraphnames.includes(params.cleanString(params.adminparagraphname2))){
			d3.select('#copyParagraphButton').style('display','none');
			d3.select('#selectParagraph2Notification')
				.text('Paragraph "' + params.adminparagraphname2 + '" already exists in group "' + params.groupname + '". Please select a different paragraph.')
				.classed('error', true);
		} else {

			//copy paragraph from admingroupname2 into groupname1
			var out = {'groupname1':params.groupname, 'admingroupname2':params.admingroupname2, 'paragraphname': params.adminparagraphname2};

			console.log('copying paragraph to new groupname', params.groupname, params.admingroupname2, params.adminparagraphname2);

			//send to flask
			$.ajax({
				url: '/copy_paragraph',
				contentType: 'application/json; charset=utf-8"',
				dataType: 'json',
				data: JSON.stringify(out),
				type: 'POST',
				success: function(d) {

					if (d.success){
						console.log('paragraph copied',d);
						loadTable(params.dbname, params.paragraphTable, compileParagraphData);
						d3.select('#copyParagraphNotification')
							.text('The paragraph was copied sucessfully.')
							.classed('error', false)
					} else {
						d3.select('#copyParagraphNotification')
							.text('An error occured, and the paragraph was not copied.  Please try again')
							.classed('error', true)
					} 
				},
				error: function(d) {
					console.log('!!! WARNING: could not copy paragraph', d);
					//error message
					d3.select('#copyParagraphNotification')
						.text('An error occured, and the paragraph was not copied.  Please try again')
						.classed('error', true)
				}
			});
		}
	}
}

function getGroupAdmins(){
	$.ajax({
		url: '/get_group_admins',
		contentType: 'application/json; charset=utf-8"',
		dataType: 'json',
		type: 'POST',
		success: function(d) {
			console.log('have group admins', d);
			params.admins = d;
		},
		error: function(d) {
			console.log('!!! WARNING: could not get group admins', d);
			params.admins = [];
		}
	});
}

function addGroupAdmin(){
	if (params.adminLevel == 'global'){
		console.log('adding group admin');

		//get the password
		var pw = d3.select('#enableGroupAdminTextInput').property('value');
		var out = { 'groupname':params.groupname, 'password':pw};

		//send to flask
		$.ajax({
			url: '/add_group_admin',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {

				if (d.success){
					console.log('group admin access granted',d);
					d3.select('#enableGroupAdminNotification')
						.text('Group admin access has been granted.')
						.classed('error', false)
					d3.select('#enableGroupAdmin').style('display','none');
					if (params.adminLevel == 'global') d3.select('#disableGroupAdmin').style('display','block');
					d3.select('#setGroupAdminPW').style('display','block');
					d3.select('#disableGroupAdminNotification').text('').classed('error',false);
					d3.select('#setGroupAdminPWNotification').text('').classed('error',false);
				} else {
					d3.select('#enableGroupAdminNotification')
						.text('An error occured.  Please try again')
						.classed('error', true)
				} 
			},
			error: function(d) {
				console.log('!!! WARNING: could not grant admin access', d);
				//error message
				d3.select('#enableGroupAdminNotification')
					.text('An error occured.  Please try again')
					.classed('error', true)
			}
		});
	}
}

function removeGroupAdmin(){
	if (params.adminLevel == 'global'){
		console.log('removing group admin');

		var out = { 'groupname':params.groupname};

		//send to flask
		$.ajax({
			url: '/remove_group_admin',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {

				if (d.success){
					console.log('group admin access has been removed',d);
					d3.select('#disableGroupAdminNotification')
						.text('Group admin access has been removed.')
						.classed('error', false)
					if (params.adminLevel == 'global') d3.select('#enableGroupAdmin').style('display','block');
					d3.select('#disableGroupAdmin').style('display','none');
					d3.select('#setGroupAdminPW').style('display','none');
					d3.select('#enableGroupAdminNotification').text('').classed('error',false);
					d3.select('#setGroupAdminPWNotification').text('').classed('error',false);
				} else {
					d3.select('#disableGroupAdminNotification')
						.text('An error occured.  Please try again')
						.classed('error', true)
				} 
			},
			error: function(d) {
				console.log('!!! WARNING: could not remove group admin access', d);
				//error message
				d3.select('#disableGroupAdminNotification')
					.text('An error occured.  Please try again')
					.classed('error', true)
			}
		});
	}


}

function setGroupAdminPW(){
	console.log('setting group admin password');

	//get the password
	var pw = d3.select('#setGroupAdminPWTextInput').property('value');
	var out = { 'groupname':params.groupname, 'password':pw};

	//send to flask
	$.ajax({
		url: '/set_group_adminPW',
		contentType: 'application/json; charset=utf-8"',
		dataType: 'json',
		data: JSON.stringify(out),
		type: 'POST',
		success: function(d) {

			if (d.success){
				console.log('group admin password changed',d);
				d3.select('#setGroupAdminPWNotification')
					.text('Group admin password was successfully updated.')
					.classed('error', false)
			d3.select('#enableGroupAdminNotification').text('').classed('error',false);
			d3.select('#disableGroupAdminNotification').text('').classed('error',false);
			} else {
				d3.select('#setGroupAdminPWNotification')
					.text('An error occured.  Please try again')
					.classed('error', true)
			} 
		},
		error: function(d) {
			console.log('!!! WARNING: could not update group admin password', d);
			//error message
			d3.select('#setGroupAdminPWNotification')
				.text('An error occured.  Please try again')
				.classed('error', true)
		}
	});

}

function makeParagraphTable(input, elem, height=400, width=null){
//make a table from the paragraph data
//https://codepen.io/chriscoyier/pen/yLVNErX

	console.log('table input', input)

	if (!width){
		width = params.windowWidth - 2; //2 for border (?)
	}

	//destroy the tabe (if it exists)
	var parent = elem.node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	var tab;
	if (input.length > 0){

		var tab = elem.append('div')
			.style('width',width + 'px')
			.style('max-height',height + 'px')
			.style('overflow','auto')
			.append('table')

		//caption at the top of the table
		// tab.append('caption')
		// 	.attr('id','paragraphTableCaption')
		// 	.text(params.paragraphname)

		//column names (fixed)
		var header = tab.append('thead').append('tr');
		header.selectAll('.paragraphTableHeader').data(input.columns).enter()
			.append('th')
			.attr('class','paragraphTableHeader')
			.style('cursor', 'pointer')
			.text(function(d){return d;})
			.on('click',sortParagraphTable)

		//body
		var body = tab.append('tbody')
		input.forEach(function(d){
			var row = body.append('tr')
				.style('cursor','pointer')
				.attr('id','paragraphTableRow' + d.index)
				.attr('index',d.index)
				.classed('disable-select', true)
			row.selectAll('.paragraphTableRow' + d.index).data(input.columns).enter()
				.append('td')
				.attr('class','paragraphTableRow' + d.index)
				.attr('index',d.index)
				.text(function(dd){return d[dd];})	
				.on('click',markParagraphRowForRemoval)	
				.on('contextmenu', markParagraphRowForAnswers)
		})

		// highlight those marked for removal
		params.adminParagraphRowsToRemove.forEach(function(d){
			d3.select('#paragraphTableRow' + d).classed('rowSelected', true)
		})

	} else {
		elem.append('div')
			.style('font-style','italic')
			.text('There are no entries in this database.')
		params.adminParagraphRowsToRemove = [];

	}


	return [tab, true];

}

function sortParagraphTable(){
	var colName = d3.select(this).text()
	console.log('sorting paragraph table by column', colName)
	params.adminParagraphData.sort(function(a, b){ 
			if (colName == 'Timestamp'){
				ad = (new Date(a.Timestamp)).getTime();
				bd = (new Date(b.Timestamp)).getTime();
				return ad - bd;
			} 
			if (typeof a[colName] === 'number' && typeof b[colName] === 'number') {
				return a[colName] - b[colName];
			}

			return ('' + a[colName]).localeCompare(b[colName])
			
		});
	var tab = makeParagraphTable(params.adminParagraphData, d3.select('#paragraphTableEditor'))

}
function markParagraphRowForRemoval(){
	//reset the row marked for answers
	params.adminParagraphRowForAnswers = null;
	d3.selectAll('.rowSelectedAnswers').classed('rowSelectedAnswers', false);

	var index0 = parseInt(d3.select(this).attr('index'));
	var indices = [index0];

	// shift to select a region
	if (event.shiftKey && params.adminParagraphRowsToRemove.length > 0){
		//get a list of indices in the order that they are in the table
		var mark = false
		params.adminParagraphData.forEach(function(d){
			if (mark) indices.push(d.index);
			if (d.index == params.adminParagraphRowsLastClick || d.index == index0) mark = !mark;
		})
	}


	console.log('checking', indices, index0)
	indices.forEach(function(index){
		var iden = '#paragraphTableRow' + index;

		if (!isNaN(index)) {
			if (event.shiftKey){
				var mark = d3.select('#paragraphTableRow' + params.adminParagraphRowsLastClick).classed('rowSelected');
				console.log(params.adminParagraphRowsLastClick, mark)
				d3.select(iden).classed('rowSelected', mark);
			} else {
				d3.select(iden).node().classList.toggle('rowSelected');
			}

			const i = params.adminParagraphRowsToRemove.indexOf(index);
			if (d3.select(iden).classed('rowSelected')){
				if (i < 0) params.adminParagraphRowsToRemove.push(index);
			} else {
				if (i >= 0) params.adminParagraphRowsToRemove.splice(i, 1);
			}

		}
	})
	console.log('rows to remove', params.adminParagraphRowsToRemove)

	d3.select('#deleteParagraphRowsNotification').text('').classed('error', false);

	params.adminParagraphRowsLastClick = index0;

}

function markParagraphRowForAnswers(){
	event.preventDefault();

	//reset the rows marked for removal
	params.adminParagraphRowsLastClick = 0;
	params.adminParagraphRowsToRemove = []
	d3.selectAll('.rowSelected').classed('rowSelected', false);
	console.log('checking', this, event, d3.event)

	var index = parseInt(d3.select(this).attr('index'));
	var iden = '#paragraphTableRow' + index;

	d3.selectAll('.rowSelectedAnswers').classed('rowSelectedAnswers', false);
	d3.select(iden).classed('rowSelectedAnswers', true);

	params.adminParagraphRowForAnswers = index;

	console.log('row for answers', params.adminParagraphRowForAnswers)

	d3.select('#setParagraphAnswersFromRowNotification').text('').classed('error', false);
}

function downloadGroupSQL(){
	window.location.replace("/download_groupSQL?groupname="+params.cleanString(params.groupname))
}
function downloadParagraphCSV(){
	window.location.replace("/download_paragraphCSV?groupname="+params.cleanString(params.groupname)+"&paragraph="+params.cleanString(params.paragraphname))
}
function adminLogout(){
	window.location.replace("/admin_logout");
}