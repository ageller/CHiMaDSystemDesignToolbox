//hide dropdowns when you click out
d3.select('body').on('click',function(){
	//if (!event.target.parentNode.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWordDropdown')){ 
	if (event.target){
		if (!event.target.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWord')){ 
			d3.select('#paraText').selectAll('select').classed('hidden', true);
		}
	}
})

//bind the username getter
d3.select('#usernameInput').on("keyup",getUsernameInput);

//resize events
window.addEventListener('resize', resize);
//window.addEventListener('load',resize);

window.addEventListener('mousemove', function(){
	params.event = window.event;
});

//hide the system design chart at load (will be displayed when user submits the second response)
if (!params.haveParaEditor && !params.haveSDCEditor) d3.select('#systemDesignChartSVGContainer').style('visibility','hidden');

//connect the web socket
//connectSocket()

//move the tooltip
// window.addEventListener('mousemove', function(){
// 	d3.select('#tooltip')
// 		.style('left', event.pageX)
// 		.style('top',event.pageY-20)
// });


//load data from the URL to define the form input
readURLdata();
if ('groupname' in params.URLInputValues) params.groupname = params.cleanString(params.URLInputValues.groupname);
updateSurveyTable();

//load in all the data
//get the paragraphs and answer key
loadTable(params.paragraphTable, compileParagraphData); 
//load in the survey responses
//but note: the visualization will not fill in until the user submits a response (this is now a recurring call and only executed after the first submit)
loadTable(params.surveyTable, aggregateResults);

initPage();

function initPage(){
//create all the plots
//if would probably be better to have a Promise, but I'm not quite sure how to do this with the google calls (just haven't tried to think it through)

	params.initInterval = setInterval(function(){
		if (params.haveParagraphData && params.haveSurveyData && params.haveAnswersData){
			clearInterval(params.initInterval);

			//update the paragraph and convert to html markup (this also updates params.paraTextSave)
			updatePara();

			//get all the words for selecting
			getSelectionWords();

			//define the dropdowns
			createDropdowns();

			//create the skeleton of the visualization (will be filled in at later)
			if (params.haveBars) {
				createBars();
				//I could check to see if anything changed before replotting, but I'm not sure that would offer a big speedup (since I'd need another for loop anyway)
				if (params.paraSubmitted) defineBars();
			}

			//create the system design chart
			if (params.haveSDC) {
				if (params.answersGroupnames.para.includes(params.cleanString(params.groupname)) || params.haveParaEditor || params.haveSDCEditor) {
					createSystemDesignChart(); //keeping this here so that it can be populated (even while hidden) for return users
				} 
				checkSDCvisibility();
				if (params.SDCSubmitted) { //will this ever happen?
					plotSDCAggregateLines();
					plotSDCAnswerLines(); 
				}
			}




			resize();
		
		}
	}, 100);
}




