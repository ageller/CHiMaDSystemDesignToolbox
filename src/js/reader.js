function loadResponses(url){
//this function can be used to load any external script
//I will use this to load the google sheet
//I will send a url that has a callback to readGoogleSheet

	console.log('loading responses...');

	//in case it's already there, remove it (not tested yet)
	var sheet = document.getElementById('GoogleSheet')
	if (sheet != null){
		sheet.remove();
	}

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
            }
        };
    } 

    script.src = url;
    script.id = 'GoogleSheet'
    document.getElementsByTagName("head")[0].appendChild(script);
}



function readGoogleSheet(json) {
//parse this json from the Google Sheet into the format that we need
	console.log('in readGoogleSheet', json)

	params.haveSurveyData = false;

	if (json.hasOwnProperty('values')){
		params.triedLoadingAgain = false;
		keys = json.values[0];
		out = [];
		for (var i = 1; i < json.values.length; i++){
			row = {};
			var vals = json.values[i];
			for (var j = 0; j < keys.length; j++){
				row[keys[j]] = vals[j];
				if (typeof row[keys[j]] == 'undefined') row[keys[j]] = '';
			}
			out.push(row);
		}
		params.responses = out;
		params.responses.columns = keys
		console.log('responses', keys, out, keys.length, params.responses)
		aggregateParaResults();
		aggregateSDCResults(); 
		updateNresponses();
//		if (params.URLInputValues.hasOwnProperty('username')) getUsernameInput(params.URLInputValues.username, {'keyCode':null});
	} else {
		console.log('WARNING: no values in the google sheet');
		//possibly from bad URL input
		if (!params.triedLoadingAgain){
			params.groupname = params.cleanString(params.groupnameOrg);
			updateSurveyFile()
			loadResponses(params.surveyFile);
			params.triedLoadingAgain = true;
		}
		//params.haveSurveyData = true;
	}

	//old format (prior to Sept. 2021)
	// var pushed = false;
	// if (json.hasOwnProperty('feed')){
	// 	if (json.feed.hasOwnProperty('entry')){
	// 		var data = json.feed.entry;
	// 		var keys = [];
	// 		var out = [];
	// 		var row = {};
	// 		for(var r=0; r<data.length; r++) {
	// 			var cell = data[r]["gs$cell"];
	// 			var val = cell["$t"];

	// 			if (cell.col == 1) {
	// 				if (!pushed && Object.keys(out).length > 0) out.push(row)
	// 				pushed = false
	// 				row = {};
	// 			}

	// 			if (cell.row == 1){
	// 				keys.push(val)
	// 			} else {
	// 				row[keys[parseInt(cell['col']) - 1]] = val;
	// 			}
				
	// 			if (parseInt(cell['col']) == keys.length & cell.row > 1){
	// 				out.push(row);
	// 				pushed = true;
	// 			}

	// 			if (r == data.length -1 && !pushed && Object.keys(out).length > 0) out.push(row);

	// 		}
	// 		out.columns = keys; //I think I can do this (if not I need to make out an object to begin with)

	// 		params.responses = out;
	// 		console.log('responses', out, data.length, params.responses)
	// 		aggregateParaResults();
	// 		aggregateSDCResults();
	// 	}
	// }
}
function readGoogleSheetParagraphs(json) {
//parse this json from the Google Sheet into the format that we need
//this now also contains the answer keys

	params.haveParagraphData = false;

	console.log('in readGoogleSheetParagraph', json)
	if (json.hasOwnProperty('values')){
		keys = json.values[0];
		out = [];
		for (var i = 1; i < json.values.length; i++){
			row = {};
			var vals = json.values[i];
			for (var j = 0; j < keys.length; j++){
				row[keys[j]] = vals[j];
				if (typeof row[keys[j]] == 'undefined') row[keys[j]] = '';
			}
			out.push(row);
		}


		//reformat this so that the groupname is a key
		//also check for avilable answers
		params.answersGroupnames = {'para':[],'SDC':[]};
		params.paragraphs = {};
		params.availableGroupnames = [];
		params.availableGroupnamesOrg = [];
		out.forEach(function(d){
			params.availableGroupnamesOrg.push(d.groupname);
			params.availableGroupnames.push(params.cleanString(d.groupname));
			params.paragraphs[params.cleanString(d.groupname)] = {};
			params.paragraphs[params.cleanString(d.groupname)].paragraph = d.paragraph;
			var a = null;
			if (d.answersJSON == ''){
				a = [{'groupname':params.cleanString(d.groupname), 'task':'para'},{'groupname':params.cleanString(d.groupname), 'task':'SDC'}]; //blank answer
			} else {
				a = JSON.parse(d.answersJSON);
				a.forEach(function(aa){
					var check = objectWithoutProperties(aa, ['task', 'groupname'])
					if (!params.answersGroupnames[aa.task].includes(params.cleanString(aa.groupname)) && Object.keys(check).length > 0) params.answersGroupnames[aa.task].push(params.cleanString(aa.groupname));
				})
			}
			params.paragraphs[params.cleanString(d.groupname)].answers = a;
		})


		//remove the blank unless the editor is active
		if (params.paragraphs.hasOwnProperty('blank') > -1 && !params.haveSDCEditor && !params.haveParaEditor) {
			delete params.paragraphs.blank;

			var index = params.availableGroupnames.indexOf('blank');
			if (index > 0) params.availableGroupnames.splice(index, 1);
			
			index = params.availableGroupnamesOrg.indexOf('blank');
			if (index > 0) params.availableGroupnamesOrg.splice(index, 1);
		}

		//params.availableGroupnames = Object.keys(params.paragraphs);

		params.paragraphs.columns = Object.keys(params.paragraphs[params.availableGroupnames[0]]);
		console.log('paragraphs', params.paragraphs, params.availableGroupnames, out);
		
		createGroupnameSelect();

		params.haveParagraphData = true;

		//pull out the answers into the previous object (easier than rewriting my old code!)
		params.answers = [];
		params.availableGroupnames.forEach(function(d, i){
			var p = params.paragraphs[d];
			if (p.answers){
				p.answers.forEach(function(a){
					var ans = {};
					Object.keys(a).forEach(function(atmp){
						akey = params.cleanString(atmp)
						//annoyingly, I've been saving the dropdown answers without applying my cleanstring.  I will do it here...
						val = a[akey];
						if (a['task'] == 'para' && akey != 'groupname' && akey != 'task') val = params.cleanString(a[akey]);
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
			if (Object.keys(params.URLInputValues).filter(function(d){return (d != 'groupname' && d !='username')}).length == 0) {
				setURLFromAnswers();
			} else {
				setAnswersFromURL();
			}
		}
	}
	params.haveAnswersData = true;

}

function setURLFromAnswers(){
	params.URLInputValues.groupname = params.cleanString(params.groupname);
	if (params.paragraphs[params.cleanString(params.groupname)].answers) {
		params.paragraphs[params.cleanString(params.groupname)].answers.forEach(function(a){
			if (a.task == 'para'){
				Object.keys(a).forEach(function(d){
					if (d != 'task' && d != 'groupname') params.URLInputValues[d] = a[d];
				})
			}
			if (a.task == 'SDC'){
				Object.keys(a).forEach(function(d){
					if (d != 'task' && d != 'groupname') params.URLInputValues['SDC'+d] = a[d].join('%20');
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
		if (params.cleanString(a.groupname) == params.cleanString(params.groupname)) {
			Object.keys(a).forEach(function(d){
				if (d != 'groupname' && d != 'task') delete a[d];
			})
		}
	})
	//now repopulate the answers
	var keys = Object.keys(params.URLInputValues);
	keys.forEach(function(k){
		if (k != 'groupname' && k != 'username'){
			var kUse = k;
			var val = params.URLInputValues[k];
			var task = 'para';
			if (k.substring(0,3) == 'SDC'){
				kUse = k.substring(3,k.length);
				task = 'SDC';
				val = params.URLInputValues[k].replaceAll('%20',' ').split(' ');
			} 
			params.answers.forEach(function(a){
				if (a.task == task && params.cleanString(a.groupname) == params.cleanString(params.groupname)) {
					a[kUse] = val;
				}
			})
		}
	})

}

function getAvailableSheets(json){
	//not used anymore (set in readGoogleSheetParagraphs)
	params.availableGroupnames = [];
	console.log('in getAvailableSheets', json)
	if (json.hasOwnProperty('sheets')){
		json.sheets.forEach(function(d){
			params.availableGroupnames.push(params.cleanString(d.properties.title));
			params.availableGroupnamesOrg.push(d.properties.title);
		})
	}
	params.availableGroupnames = params.availableGroupnames.sort();
	console.log('have available groupnames', params.availableGroupnames);
	createGroupnameSelect();
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

function updateNresponses(){
	//update the number of responses
	var NPara = params.responses.filter(function(d){return (d.task == 'para' && d.version == params.paraResponseVersion);}).length;
	d3.select('#boxGridNResponses').text('Number of Responses : '+NPara)

	var NSDC = params.responses.filter(function(d){return (d.task == 'SDC' && d.version == params.SDCResponseVersion);}).length;
	d3.select('#SDCNResponses').text('Number of Responses : '+NSDC)
}

function aggregateParaResults(){


	//count up all the responses for each column and return the aggregate numbers
	//in order to keep things a bit more simple, I will push a blank entry for version 0 (I may want to clean this up later)
	params.aggregatedParaResponses = [{}]

	for (var version=1; version<=2; version+=1){
		params.aggregatedParaResponses.push({});

		params.responses.columns.forEach(function(rc,i){
			if (!rc.includes('Timestamp') && !rc.includes('IP') && !rc.includes('username') && !rc.includes('version') && !rc.includes('task')){
				vals = []
				//params.responses.forEach(function(r,j){
				var using = params.responses.filter(function(d){return (d.version == version && d.task == 'para');});
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
				if (params.paraSubmitted) defineBars();
			}

		})
	}

}

function aggregateSDCResults(){


	//count up all the responses for each column and return the aggregate numbers
	//in order to keep things a bit more simple, I will push a blank entry for version 0 (I may want to clean this up later)
	params.aggregatedSDCResponses = [{}];
	params.aggregatedSDCResponses.nVersion = [0];
	for (var version=1; version<=2; version+=1){
		params.aggregatedSDCResponses.push({});
		var using = params.responses.filter(function(d){return (d.version == version && d.task == 'SDC');});
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
				console.log("aggregatedSDC", params.aggregatedSDCResponses);
				if (params.SDCSubmitted || params.haveSDCEditor) {
					var dur = 0;
					if (params.firstSDCplot){
						dur = params.transitionDuration;
						params.firstSDCplot = false;
					}
					plotSDCAggregateLines(dur);
					plotSDCAnswerLines(dur); 
				}
				//for testing
				//params.SDCSubmitted = true;
			}

		})
	}
}