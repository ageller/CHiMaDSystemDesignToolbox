params.haveAdmin = true;

//resize events
window.addEventListener('resize', resize);
resize();

//bind the groupname getter
d3.select('#groupnameTextInput').on("keyup",function(){getGroupnameInput('groupnameTextInput','groupnameNotification');});
d3.select('#renameGroupnameTextInput').on("keyup",function(){getGroupnameInput('renameGroupnameTextInput','renameGroupnameNotification');});

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
}
function initAdmin(){
	loadTable('available_dbs.db', 'dbs', adminCallback);
	resetAdminNotifications();
}
initAdmin();

function resetAdminNotifications(groupVisibility = 'hidden', paraVisibility = 'hidden'){
	if (groupVisibility) d3.select('#editGroupnameButtons').style('visibility',groupVisibility);
	d3.select('#deleteGroupnameNotification').text('').classed('error', false)
	d3.select('#renameGroupnameNotification').text('').classed('error', false)
	d3.select('#renameGroupnameTextInput').property('value','')
	d3.select('#groupnameTextInput').property('value','')

	if (paraVisibility) d3.select('#editParagraphButtons').style('visibility',paraVisibility);
	d3.select('#deleteParagraphNotification').text('').classed('error', false)
	d3.select('#renameParagraphNotification').text('').classed('error', false)
	d3.select('#renameParagraphTextInput').property('value','')
	d3.select('#paragraphTextInput').property('value','')
}

function initGroupnameAdmin(){
	console.log('initGroupnameAdmin', this.value)
	setGroupname(this.value);
	updateSurveyTable();
	//load in all the data
	//get the paragraphs and answer key
	loadTable(params.dbname, params.paragraphTable, compileParagraphData); 
	//load in the survey responses
	//but note: the visualization will not fill in until the user submits a response (this is now a recurring call and only executed after the first submit)
	loadTable(params.dbname, params.surveyTable, aggregateResults);
	resetAdminNotifications('visible');
}

function adminParaSelect(){
	params.paragraphname = params.cleanString(this.value);
	console.log('setting paragraphname', params.paragraphname);
	updateSurveyTable();
	loadTable(params.dbname, params.surveyTable, adminParaSelectCallback);
	resetAdminNotifications('visible', 'visible')
}

function adminParaSelectCallback(data){
	console.log('have para data', data)
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
		.on('change',initGroupnameAdmin)


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

function addGroupname(){

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
						.text('The group name added sucessfully.')
						.classed('error', false)
				} else {
					d3.select('#groupnameNotification')
						.text('The group name was not added.  Please enter a different groupname a try again')
						.classed('error', true)
				} 
			},
			error: function(d) {
				console.log('!!! WARNING: could not add group name', d);
				//error message
				d3.select('#groupnameNotification')
					.text('The group name was not added.  Please enter a different groupname a try again')
					.classed('error', true)
			}
		});
}

function deleteGroupname(){

	var good = true
	var groupname = d3.select('#groupnameSelect').property('value');

	if (groupname == 'Select from list'){
		d3.select('#deleteGroupnameNotification')
			.text('Please select a groupname first.')
			.classed('error', true);
		good = false;
	}

	if (good && params.groupname == 'default'){
		d3.select('#deleteGroupnameNotification')
			.text('You cannot delete the default groupname.')
			.classed('error', true);
		good = false;
	} 

	if (good) {
		console.log('deleting groupname', params.groupname);
		let proceed = confirm('You are about to delete group name "' + params.groupname +'".  This action cannot be undone.');
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
							initAdmin();
							d3.select('#deleteGroupnameNotification')
								.text('Group name was successfully deleted.')
								.classed('error', false)
						} else {
							d3.select('#deleteGroupnameNotification')
								.text('An error occured.  The group name was not deleted.  Please try again')
								.classed('error', true)	
						}
		
					},
					error: function(d) {
						console.log('!!! WARNING: could not delete group name', d);
						//error message
						d3.select('#deleteGroupnameNotification')
							.text('An error occured.  The group name was not deleted.  Please try again')
							.classed('error', true)
					}
				});

		} else{
			d3.select('#deleteGroupnameNotification')
				.text('Canceled by user. The group name was not deleted.')
				.classed('error', false)
		}
	}
}

function renameGroupname(){

	var good = true;
	var groupname = d3.select('#groupnameSelect').property('value');
	if (groupname == 'Select from list'){
		d3.select('#deleteGroupnameNotification')
			.text('Please select a groupname first.')
			.classed('error', true);
		good = false;
	}

	if (good && params.groupname == 'default'){
		d3.select('#renameGroupnameNotification')
			.text('You cannot rename the default groupname.')
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
						loadTable('available_dbs.db', 'dbs', adminCallbackRename);
						d3.select('#renameGroupnameNotification')
							.text('Group name was successfully renamed.')
							.classed('error', false)
					} else {
						d3.select('#renameGroupnameNotification')
							.text('An error occured.  The group name was not renamed.  Please try again')
							.classed('error', true)	
					}
	
				},
				error: function(d) {
					console.log('!!! WARNING: could not rename group name', d);
					//error message
					d3.select('#renameGroupnameNotification')
						.text('An error occured.  The group name was not renamed.  Please try again')
						.classed('error', true)
				}
			});


	}
}

function deleteParagraph(){

	// var good = true
	// var groupname = d3.select('#groupnameSelect').property('value');

	// if (groupname == 'Select from list'){
	// 	d3.select('#deleteGroupnameNotification')
	// 		.text('Please select a groupname first.')
	// 		.classed('error', true);
	// 	good = false;
	// }

	// if (good && params.groupname == 'default'){
	// 	d3.select('#deleteGroupnameNotification')
	// 		.text('You cannot delete the default groupname.')
	// 		.classed('error', true);
	// 	good = false;
	// } 

	// if (good) {
	// 	console.log('deleting groupname', params.groupname);
	// 	let proceed = confirm('You are about to delete group name "' + params.groupname +'".  This action cannot be undone.');
	// 	console.log(proceed);

	// 	if (proceed){
	// 		var out = {'groupname':params.groupname};

	// 		//send to flask
	// 		$.ajax({
	// 				url: '/delete_groupname',
	// 				contentType: 'application/json; charset=utf-8"',
	// 				dataType: 'json',
	// 				data: JSON.stringify(out),
	// 				type: 'POST',
	// 				success: function(d) {
	// 					if (d.success){
	// 						console.log('groupname deleted',d);
	// 						initAdmin();
	// 						d3.select('#deleteGroupnameNotification')
	// 							.text('Group name was successfully deleted.')
	// 							.classed('error', false)
	// 					} else {
	// 						d3.select('#deleteGroupnameNotification')
	// 							.text('An error occured.  The group name was not deleted.  Please try again')
	// 							.classed('error', true)	
	// 					}
		
	// 				},
	// 				error: function(d) {
	// 					console.log('!!! WARNING: could not delete group name', d);
	// 					//error message
	// 					d3.select('#deleteGroupnameNotification')
	// 						.text('An error occured.  The group name was not deleted.  Please try again')
	// 						.classed('error', true)
	// 				}
	// 			});

	// 	} else{
	// 		d3.select('#deleteGroupnameNotification')
	// 			.text('Canceled by user. The group name was not deleted.')
	// 			.classed('error', false)
	// 	}
	// }
}

function renameParagraph(){

	// var good = true;
	// var groupname = d3.select('#groupnameSelect').property('value');
	// if (groupname == 'Select from list'){
	// 	d3.select('#deleteGroupnameNotification')
	// 		.text('Please select a groupname first.')
	// 		.classed('error', true);
	// 	good = false;
	// }

	// if (good && params.groupname == 'default'){
	// 	d3.select('#renameGroupnameNotification')
	// 		.text('You cannot rename the default groupname.')
	// 		.classed('error', true);
	// 	good = false

	// } 

	// if (good) {
	// 	var groupname = d3.select('#renameGroupnameTextInput').property('value')
	// 	console.log('renaming groupname: current, new', params.groupname, groupname);

	// 	var out = {'groupname':params.groupname, 'newname':groupname};

	// 	//send to flask
	// 	$.ajax({
	// 			url: '/rename_groupname',
	// 			contentType: 'application/json; charset=utf-8"',
	// 			dataType: 'json',
	// 			data: JSON.stringify(out),
	// 			type: 'POST',
	// 			success: function(d) {
	// 				if (d.success){
	// 					console.log('groupname rename',d);
	// 					loadTable('available_dbs.db', 'dbs', adminCallbackRename);
	// 					d3.select('#renameGroupnameNotification')
	// 						.text('Group name was successfully renamed.')
	// 						.classed('error', false)
	// 				} else {
	// 					d3.select('#renameGroupnameNotification')
	// 						.text('An error occured.  The group name was not renamed.  Please try again')
	// 						.classed('error', true)	
	// 				}
	
	// 			},
	// 			error: function(d) {
	// 				console.log('!!! WARNING: could not rename group name', d);
	// 				//error message
	// 				d3.select('#renameGroupnameNotification')
	// 					.text('An error occured.  The group name was not renamed.  Please try again')
	// 					.classed('error', true)
	// 			}
	// 		});


	// }
}