
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
d3.select('#groupnameInput').on("keyup",getGroupnameInput);

//resize events
window.addEventListener('resize', resize);
//window.addEventListener('load',resize);

window.addEventListener('mousemove', function(){
	params.event = window.event;
});

//hide the system design chart at load (will be displayed when user submits the second response)
d3.select('#systemDesignChartSVGContainer').style('visibility','hidden');

//move the tooltip
// window.addEventListener('mousemove', function(){
// 	d3.select('#tooltip')
// 		.style('left', event.pageX)
// 		.style('top',event.pageY-20)
// });


//load data from the URL to define the form input
readURLdata();
if ('groupname' in params.URLInputValues) params.groupname = params.URLInputValues.groupname;
updateSurveyFile();

//load in all the data
//get the paragraphs, and this also calls functions to update the paragraph (based on the groupname of the url), define the selection words and create the dropdowns
loadResponses(params.paragraphFile);
//the visualization will not fill in until the user submits (this is now a recurring call and only executed after the first submit)
loadResponses(params.surveyFile);
//this will be replaced by a call to the google sheet (answers should be within the paragraphFile)
loadAnswers();

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

			//create the skeleton of the visualization (will be filled in at loadResponses for the surveyFile)
			if (params.haveBars) {
				createBars();
				//I could check to see if anything changed before replotting, but I'm not sure that would offer a big speedup (since I'd need another for loop anyway)
				if (params.paraSubmitted) defineBars();
			}

			//create the system design chart
			if (params.haveSDC) {
				if ((params.answersGroupnames.includes(params.groupname))) {
					createSystemDesignChart(); //keeping this here so that it can be populated (even while hidden) for return users
				} 
				checkSDCvisibility();
				if (params.SDCSubmitted) {
					plotSDCAggregateLines();
					if (params.transitionSDCAnswers) plotSDCAnswerLines(); //params.transitionSDCAnswers will only be true at the start, this way we don't plot multiple answer lines on top of each other
				}
			}




			resize();
		
		}
	}, 100);
}




