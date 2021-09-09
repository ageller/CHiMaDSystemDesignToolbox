
//hide dropdowns when you click out
d3.select('body').on('click',function(){
	//if (!event.target.parentNode.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWordDropdown')){ 
	if (!event.target.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWord')){ 
		d3.select('#paraText').selectAll('select').classed('hidden', true);
	}
})

//bind the username getter
d3.select('#usernameInput').on("keyup",getUsername);
d3.select('#groupnameInput').on("keyup",getGroupname);

//resize events
window.addEventListener('resize', resize);
window.addEventListener('load',resize);


//hide the system design chart at load (will be displayed when user submits the second response)
d3.select('#systemDesignChartSVGContainer').style('visibility','hidden');

//move the tooltip
// window.addEventListener('mousemove', function(){
// 	d3.select('#tooltip')
// 		.style('left', event.pageX)
// 		.style('top',event.pageY-20)
// });

//get the available tabs in the Google sheet and create the select box
//this could be removed now and just take the 'groupname' column in the paragraphs tab, within loadResponses(params.paragraphFile)
//loadResponses(params.sheetRequest);

//get the paragraphs
loadResponses(params.paragraphFile);

//convert the paragraph with tagged words to contain html markup
convertPara();

//get all the words for selecting
getSelectionWords();

//read in the answer key
loadAnswers();

//load data from the URL to define the form input
readURLdata();

//add the dropdowns for each selection word
createDropdowns();

//create the skeleton of the visualization (will be filled in at loadResponses)
//this is now called in resize
//createBars();

//create the skeleton of the system design chart
//using answers now, and will call this within reload (but will this always happen after loadAnswers?)
//createSystemDesignChart();

//load the responses to check if username already exists
//the visualization will not fill in until the user submits (this is now a recurring call and only executed after the first submit)
loadResponses(params.surveyFile);