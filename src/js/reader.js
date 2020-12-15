//this function can be used to load any external script
//I will use this to load the google sheet
function loadResponses(url){

	//in case it's already there, remove it (not tested yet)
	var sheet = document.getElementById('GoogleSheet')
	if (sheet != null){
		sheet.removeChild(list.childNodes[0]);
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



//parse this json from the Google Sheet into the format that we need
function readGoogleSheet(json) {
	if (json.hasOwnProperty('feed')){
		if (json.feed.hasOwnProperty('entry')){
			var data = json.feed.entry;
			var keys = [];
			var out = [];
			var row = null;
			var j = 0;
			for(var r=0; r<data.length; r++) {
				var cell = data[r]["gs$cell"];
				var val = cell["$t"];

				if (cell.col == 1) {
					if (j > 0){
						out.push(row);
					}
					j = 0;
					row = {};
				}

				if (cell.row == 1){
					keys.push(val)
				} else {
					row[keys[j]] = val;
				}

				j += 1;

			}
			out.columns = keys; //I think I can do this (if not I need to make out an object to begin with)

			params.responses = out;
			console.log('responses', data.length, params.responses)
			aggregateResults();

			//colorBoxes();
		}
	}
}

//count the uniq elements in an array and return both the counts and the unique array
function countUniq(arr){
	out = {'uniq':[], 'num':{}};

	arr.forEach(function(a,i){
		ac = params.cleanString(a);
		if (!out.uniq.includes(ac)){
			out.uniq.push(ac);
			out.num[ac] = 1;
		} else {
			out.num[ac] += 1;
		}
	})

	return out;
}

function aggregateResults(){

	//count up all the responses for each column and return the aggregate numbers
	params.responses.columns.forEach(function(rc,i){
		if (!rc.includes('Timestamp') && !rc.includes('IP') && !rc.includes('username') && !rc.includes('version')){
			vals = []
			params.responses.forEach(function(r,j){
				//get the column
				var v = r[rc];
				if (typeof v == "undefined"){
					v = ""
				}
				vals.push(v)
				if (j == params.responses.length - 1){
					params.aggregatedResponses[rc] = countUniq(vals);
				}
			})

		}

	})

}