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
	var pushed = false;
	if (json.hasOwnProperty('feed')){
		if (json.feed.hasOwnProperty('entry')){
			var data = json.feed.entry;
			var keys = [];
			var out = [];
			var row = {};
			for(var r=0; r<data.length; r++) {
				var cell = data[r]["gs$cell"];
				var val = cell["$t"];

				if (cell.col == 1) {
					if (!pushed && Object.keys(out).length > 0) out.push(row)
					pushed = false
					row = {};
				}

				if (cell.row == 1){
					keys.push(val)
				} else {
					row[keys[parseInt(cell['col']) - 1]] = val;
				}
				
				if (parseInt(cell['col']) == keys.length & cell.row > 1){
					out.push(row);
					pushed = true;
				}

				if (r == data.length -1 && !pushed && Object.keys(out).length > 0) out.push(row);

			}
			out.columns = keys; //I think I can do this (if not I need to make out an object to begin with)

			params.responses = out;
			console.log('responses', out, data.length, params.responses)
			aggregateParaResults();
			aggregateSDCResults();
		}
	}
}

function countUniq(arr){
//count the uniq elements in an array and return both the counts and the unique array
	var out = {'uniq':[], 'num':{}, 'total':0};

	arr.forEach(function(a,i){
		ac = params.cleanString(a);
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
				//I could check to see if anything changed before replotting, but I'm not sure that would offer a big speedup (since I'd need another for loop anyway)
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
				if (params.SDCSubmitted) {
					plotSDCAggregateLines();
					if (params.showSDCAnswers && params.transitionSDCAnswers) plotSDCAnswerLines(); //params.transitionSDCAnswers will only be true at the stars, this way we don't plot multiple answer lines on top of each other
				}
				//for testing
				//params.SDCSubmitted = true;
			}

		})
	}

}
//for now I will work with a static csv file for the correct responses
function loadAnswers() {
	Promise.all([
		d3.csv('src/data/answers_clean.csv'),
	]).then(function(d) {
		params.answers = d[0];
		console.log("answers",params.answers)
		createSystemDesignChart();
	})
	.catch(function(error){
		console.log('ERROR:', error)
	})
}