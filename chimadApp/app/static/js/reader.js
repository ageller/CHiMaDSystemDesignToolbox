function loadFile(file, callback){
//a bit of a round-about way of doing things, but I will take "callback" as the string name of the callback to flask, and then call it from sockets.js

	var out = {'filename': file};
	console.log('loading file ', out)

	//send the file name to flask.  I will read in the data there, and then it will be sent back via POST
	$.ajax({
			url: '/load_file',
			contentType: 'application/json; charset=utf-8"',
			dataType: 'json',
			data: JSON.stringify(out),
			type: 'POST',
			success: function(d) {
				console.log('loaded file',d);
				var data = JSON.parse(d.data);
				data.columns = d.columns;
				callback(data)

			},
			error: function(d) {
				console.log('!!! WARNING: file did not load', d);
			}
		});
}



function aggregateResults(data) {
//store the data and aggregate the results
	console.log('in aggregateResults', data)
	
	params.responses = data;

	params.haveSurveyData = false;

	if (params.username && params.switchedGroupname){
		console.log('!!! CHECK populating from username')
		getUsernameInput(params.username);
		params.switchedGroupname = false;
	} 

	aggregateParaResults();
	aggregateSDCResults(); 



}

function compileParagraphData(data) {
//parse the csv (originally from the google sheet) into the format that we need
//this now also contains the answer keys

	params.haveParagraphData = false;

	console.log('in compileParagraphData', data)

	//reformat this so that the groupname is a key
	//also check for avilable answers
	params.answersGroupnames = {'para':[],'SDC':[]};
	params.paragraphs = {};
	params.availableGroupnames = [];
	params.availableGroupnamesOrg = [];
	data.forEach(function(d){
		params.availableGroupnamesOrg.push(d.groupname);
		params.availableGroupnames.push(params.cleanString(d.groupname));
		params.paragraphs[params.cleanString(d.groupname)] = {};
		params.paragraphs[params.cleanString(d.groupname)].paragraph = d.paragraph;
		var a = null;
		d.answersJSON
		if (d.answersJSON == '' || d.answersJSON == null){
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

	params.paragraphs.columns = Object.keys(params.paragraphs[params.availableGroupnames[0]]);
	console.log('paragraphs', params.paragraphs, params.availableGroupnames, params.answersGroupnames, data);
	
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