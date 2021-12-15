params.haveAdmin = true;

//resize events
window.addEventListener('resize', resize);
resize();

//bind the input getters
d3.select('#groupnameTextInput').on("keyup",function(){getGroupnameInput('groupnameTextInput','groupnameNotification');});
d3.select('#renameGroupnameTextInput').on("keyup",function(){getGroupnameInput('renameGroupnameTextInput','renameGroupnameNotification');});
d3.select('#renameParagraphTextInput').on("keyup",function(){getParagraphnameInput('renameParagraphTextInput','renameParagraphNotification');});

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
	d3.select('#deleteParagraphRowsNotification').text('').classed('error', false);
	d3.select('#renameParagraphTextInput').property('value','')
	d3.select('#paragraphTextInput').property('value','')
}

function initGroupnameAdmin(){
	console.log('initGroupnameAdmin', params.groupname)
	loadTable(params.dbname, params.paragraphTable, compileParagraphData); 
	if (params.availableParagraphnames.length > 0){
		updateSurveyTable();	
		loadTable(params.dbname, params.surveyTable, aggregateResults);
	}
	resetAdminNotifications('visible');
}

function initParagraphnameAdmin(data){
	loadTable(params.dbname, params.paragraphTable, compileParagraphData); 
	if (data.newname){
		params.paragraphname = params.cleanString(data.newname);
		console.log('setting paragraphname', params.paragraphname);
		updateSurveyTable();
		loadTable(params.dbname, params.surveyTable, adminParaSelectCallback);
	}
	resetAdminNotifications('visible', 'visible')
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

function deleteGroupname(){

	var good = true
	var groupname = d3.select('#groupnameSelect').property('value');

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
		let proceed = confirm('You are about to delete group "' + params.groupname +'".  This action cannot be undone.');
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
	var groupname = d3.select('#groupnameSelect').property('value');
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
	var index0 = parseInt(d3.select(this).attr('index'));
	var indices = [index0];

	// shift to select a region (not built yet)
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

function downloadGroupSQL(){
	window.location.replace("/download_groupSQL?groupname="+params.cleanString(params.groupname))
}
function downloadParagraphCSV(){
	window.location.replace("/download_paragraphCSV?groupname="+params.cleanString(params.groupname)+"&paragraph="+params.cleanString(params.paragraphname))
}