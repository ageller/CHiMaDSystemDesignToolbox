function loadTable(dbname, table, callback){
//load a table from the SQL database

	var out = {'tablename': table, 'dbname':dbname};
	console.log('loading table ', out)

	//send the table name to flask.  I will read in the data there, and then it will be sent back via POST
	$.ajax({
			url: '/load_table',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				console.log('loaded table',d);
				var data = JSON.parse(d.data);
				data.columns = d.columns;
				params.triedLoadingAgain[table] = false;
				if (callback) callback(data)

			},
			error: function(d) {
				console.log('!!! WARNING: table did not load', d);
				//possibly from bad URL input 
				if (!params.triedLoadingAgain[table]){
					logout();
					loadTable(dbname, table, callback);
					params.triedLoadingAgain[table] = true;
				}
			}
		});
}

function getTableNames(callback){
//load a table from the SQL database

	var out = {'dbname':params.dbname};
	console.log('getting table names ', out)

	//send the db name to flask.  I will read in the data there, and then it will be sent back via POST
	$.ajax({
			url: '/get_table_names',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				console.log('have table names',d);
				params.triedLoadingAgain[params.dbname] = false;
				callback(d.tables)

			},
			error: function(d) {
				console.log('!!! WARNING: table did not load', d);
				//possibly from bad URL input 
				if (!params.triedLoadingAgain[params.dbname]){
					getTableNames(callback);
					params.triedLoadingAgain[params.dbname] = true;
				}
			}
		});
}


function updateNresponses(){
	//update the number of responses
	var using = params.responses.filter(function(d){return (d.task == 'para')});
	if (params.parResponseVersion > 0) using = using.filter(function(d){return (d.version == params.paraResponseVersion);})
	var NPara = using.length;
	d3.select('#boxGridNResponses').text('Number of Responses : '+NPara)

	using = params.responses.filter(function(d){return (d.task == 'SDC' && d.date.getTime() >= params.SDCHist.dateAggLims[0].getTime() && d.date.getTime() <= params.SDCHist.dateAggLims[1].getTime());});
	if (params.SDCResponseVersion > 0) using = using.filter(function(d){return (d.version == params.SDCResponseVersion);});
	var NSDC = using.length;
	d3.select('#SDCNResponses').text('Number of Responses : '+NSDC)
}

function setResponseDates(){
	params.responses.forEach(function(d){
		d.date = new Date(d.Timestamp);
	})

	if (params.firstSDCplot && params.haveSDC) setSDCResponseDateRange();
	if (params.firstParaPlot && params.haveBars) setParaResponseDateRange();
}

function aggregateResults(data) {
//store the data and aggregate the results
	console.log('in aggregateResults', data)
	
	params.responses = data;
	setResponseDates();

	params.haveSurveyData = false;

	if (params.username && params.switchedParagraphname){
		console.log('!!! CHECK populating from username')
		getUsernameInput(params.username);
		params.switchedParagraphname = false;
	} 

	aggregateParaResults(0);
	aggregateSDCResults(false, 0); 

	updateNresponses();
}

function compileParagraphData(data) {
//parse the data (originally from the google sheet) into the format that we need
//this now also contains the answer keys

	params.haveParagraphData = false;

	console.log('in compileParagraphData', data)

	//reformat this so that the paragraphname is a key
	//also check for avilable answers
	params.answersParagraphnames = {'para':[],'SDC':[]};
	params.paragraphs = {};
	params.availableParagraphnames = [];
	params.availableParagraphnamesOrg = [];
	data.forEach(function(d){
		params.availableParagraphnamesOrg.push(d.paragraphname);
		params.availableParagraphnames.push(params.cleanString(d.paragraphname));
		params.paragraphs[params.cleanString(d.paragraphname)] = {};
		params.paragraphs[params.cleanString(d.paragraphname)].paragraph = d.paragraph;
		var a = null;
		d.answersJSON
		if (d.answersJSON == '' || d.answersJSON == null){
			a = [{'paragraphname':params.cleanString(d.paragraphname), 'task':'para'},{'paragraphname':params.cleanString(d.paragraphname), 'task':'SDC'}]; //blank answer
		} else {
			a = JSON.parse(d.answersJSON);
			a.forEach(function(aa){
				var check = objectWithoutProperties(aa, ['task', 'paragraphname'])
				if (!params.answersParagraphnames[aa.task].includes(params.cleanString(aa.paragraphname)) && Object.keys(check).length > 0) params.answersParagraphnames[aa.task].push(params.cleanString(aa.paragraphname));
			})
		}
		params.paragraphs[params.cleanString(d.paragraphname)].answers = a;
	})


	//remove the blank unless the editor is active
	if (params.paragraphs.hasOwnProperty('blank') > -1 && !params.haveSDCEditor && !params.haveParaEditor) {
		delete params.paragraphs.blank;

		var index = params.availableParagraphnames.indexOf('blank');
		if (index > 0) params.availableParagraphnames.splice(index, 1);
		
		index = params.availableParagraphnamesOrg.indexOf('blank');
		if (index > 0) params.availableParagraphnamesOrg.splice(index, 1);
	}

	params.paragraphs.columns = Object.keys(params.paragraphs[params.availableParagraphnames[0]]);
	console.log('paragraphs', params.paragraphs, params.availableParagraphnames, params.answersParagraphnames, data);
	
	createParagraphnameSelect();

	params.haveParagraphData = true;

	//pull out the answers into the previous object (easier than rewriting my old code!)
	params.answers = [];
	params.availableParagraphnames.forEach(function(d, i){
		var p = params.paragraphs[d];
		if (p.answers){
			p.answers.forEach(function(a){
				var ans = {};
				Object.keys(a).forEach(function(atmp){
					akey = params.cleanString(atmp)
					//annoyingly, I've been saving the dropdown answers without applying my cleanstring.  I will do it here...
					val = a[akey];
					//console.log(akey, val)
					if (a['task'] == 'para' && akey != 'paragraphname' && akey != 'task') val = params.cleanString(a[akey]);
					ans[akey] = val;

				})
				params.answers.push(ans);
			})
		}
	})
	params.answersOrg = [];
	params.answers.forEach(function(d){params.answersOrg.push(cloneObject(d));});

	console.log("answers",params.answers);

	//for editing mode, populate the URL so that all the answers can be displayed
	if (params.haveParaEditor){
		setURLFromAnswers();

		//this would allow the answers to propagate from another sheet, which I don't think we want anymore
		// if (Object.keys(params.URLInputValues).filter(function(d){return (d != 'paragraphname' && d !='username')}).length == 0) {
		// 	setURLFromAnswers();
		// } else {
		// 	setAnswersFromURL();
		// }
	}

	params.haveAnswersData = true;

}

function compileAvailableGroupnames(data){
	params.availableGroupnames = [];
	data.forEach(function(d){
		params.availableGroupnames.push(d.groupname);
	})
	params.haveGroupnames = true;
	console.log('have available groupnames', params.availableGroupnames);
}

function setURLFromAnswers(){
	params.URLInputValues.paragraphname = params.cleanString(params.paragraphname);
	if (params.paragraphs[params.cleanString(params.paragraphname)].answers) {
		params.paragraphs[params.cleanString(params.paragraphname)].answers.forEach(function(a){
			if (a.task == 'para'){
				Object.keys(a).forEach(function(d){
					if (d != 'task' && d != 'paragraphname') params.URLInputValues[d] = a[d];
				})
			}
			if (a.task == 'SDC'){
				Object.keys(a).forEach(function(d){
					if (d != 'task' && d != 'paragraphname') params.URLInputValues['SDC'+d] = a[d].join('%20');
				})
			}
		})
		appendURLdata();
	}
}

function setAnswersFromURL(){
	console.log('!!! setting URL from answers')
	//I will clear out the answers here and only use the URL data (this should only be used within the editor)
	params.answers.forEach(function(a){
		if (params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname)) {
			Object.keys(a).forEach(function(d){
				if (d != 'paragraphname' && d != 'task') delete a[d];
			})
		}
	})
	//now repopulate the answers
	var keys = Object.keys(params.URLInputValues);
	keys.forEach(function(k){
		if (k != 'paragraphname' && k != 'username'){
			var kUse = k;
			var val = params.URLInputValues[k];
			var task = 'para';
			if (k.substring(0,3) == 'SDC'){
				kUse = k.substring(3,k.length);
				task = 'SDC';
				val = params.URLInputValues[k].replaceAll('%20',' ').split(' ');
			} 
			params.answers.forEach(function(a){
				if (a.task == task && params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname)) {
					a[kUse] = val;
				}
			})
		}
	})

}

function countUniq(arr, clean=true){
//count the uniq elements in an array and return both the counts and the unique array
	var out = {'uniq':[], 'num':{}, 'total':0};

	arr.forEach(function(a,i){
		ac = a;
		if (clean) ac = params.cleanString(a);
		if (!out.uniq.includes(ac)){
			out.uniq.push(ac);
			out.num[ac] = 1;
		} else {
			out.num[ac] += 1;
		}
		out.total += 1;
	})


	return out;
}

function aggregateParaResults(UIduration = params.transitionDuration){

	//count up all the responses for each column and return the aggregate numbers
	//in order to keep things a bit more simple, I will push a blank entry for version 0 (I may want to clean this up later)
	params.aggregatedParaResponses = {}

	var responses = params.responses.filter(function(d){return (d.task == 'SDC');});
	var versions = [0];
	responses.forEach(function(d){
		if (!(d.version in versions)) versions.push(d.version);
	})
	versions.forEach(function(version){

		params.aggregatedParaResponses[version] = {};

		params.responses.columns.forEach(function(rc,i){
			if (!rc.includes('Timestamp') && !rc.includes('IP') && !rc.includes('username') && !rc.includes('version') && !rc.includes('task')){
				vals = []
				var using = params.responses.filter(function(d){return (d.task == 'para' && d.date.getTime() >= params.paraHist.dateAggLims[0].getTime() && d.date.getTime() <= params.paraHist.dateAggLims[1].getTime());});
				if (version > 0) using = using.filter(function(d){return (d.version == version);});

				//var using = params.responses.filter(function(d){return (d.version == version && d.task == 'para');});
				
				using.forEach(function(r,j){
					//get the column
					var v = r[rc];
					if (typeof v == "undefined"){
						v = ""
					}
					vals.push(v)
					if (j == using.length - 1){
						params.aggregatedParaResponses[version][rc] = countUniq(vals);
					}
				})

			}
	//plot the results
			if (i == params.responses.columns.length - 1 && version == params.paraResponseVersion){
				console.log("aggregatedPara", params.aggregatedParaResponses);
				params.haveSurveyData = true;
				if (params.paraSubmitted) {
					params.firstParaPlot = false;
					defineBars();
					initParaAggDateUI(UIduration);
				} else {
					if (params.haveSDCEditor) initParaAggDateUI(UIduration);
				}

			}

		})
	})

}

function aggregateSDCResults(transitionPlot = false, UIduration = params.transitionDuration){
	//We are moving away from tracking versions, but I will still keep the functionality in here (at least for now)
	//version -1 will contain all the data

	//count up all the responses for each column and return the aggregate numbers
	//in order to keep things a bit more simple, I will push a blank entry for version 0 (I may want to clean this up later)
	params.aggregatedSDCResponses = {};
	params.aggregatedSDCResponses.nVersion = [];
	var responses = params.responses.filter(function(d){return (d.task == 'SDC');});
	var versions = [0];
	responses.forEach(function(d){
		if (!(d.version in versions)) versions.push(d.version);
	})
	versions.forEach(function(version){
		params.aggregatedSDCResponses[version] = {};
		var using = params.responses.filter(function(d){return (d.task == 'SDC' && d.date.getTime() >= params.SDCHist.dateAggLims[0].getTime() && d.date.getTime() <= params.SDCHist.dateAggLims[1].getTime());});
		if (version > 0) using = using.filter(function(d){return (d.version == version);});

		params.aggregatedSDCResponses.nVersion.push(using.length);

		params.responses.columns.forEach(function(rc,i){
			if (!rc.includes('Timestamp') && !rc.includes('IP') && !rc.includes('username') && !rc.includes('version') && !rc.includes('task')){
				var vals = []

				using.forEach(function(r,j){
					//get the column
					var v = r[rc];
					if (typeof v == "undefined"){
						v = ""
					}
					vals = vals.concat(v.split(' '));
					var blanks = getAllIndices(vals,"");
					blanks.forEach(function(b){vals.splice(b, 1)});
					if (j == using.length - 1){
						params.aggregatedSDCResponses[version][rc] = countUniq(vals);
					}
				})

			}
			//plot the results
			if (i == params.responses.columns.length - 1 && version == params.SDCResponseVersion){
				//console.log("aggregatedSDC", params.aggregatedSDCResponses);
				if (params.SDCSubmitted || params.haveSDCEditor) {
					var dur = 0;
					if (params.firstSDCplot || transitionPlot){
						dur = params.transitionDuration;
						params.firstSDCplot = false;
					}
					if (transitionPlot) {
						replotSDCAggregateLines(dur);
					} else{
						plotSDCAggregateLines(dur);
						plotSDCAnswerLines(dur); 
					}
					initSDCAggDateUI(UIduration);
				}
				//for testing
				//params.SDCSubmitted = true;
			}

		})
	})
}