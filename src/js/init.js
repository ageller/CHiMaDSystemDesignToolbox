
//hide dropdowns when you click out
d3.select('body').on('click',function(){
	//if (!event.target.parentNode.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWordDropdown')){ 
	if (!event.target.parentNode.classList.contains('selectionWord')){ 
		d3.selectAll('select').classed('hidden', true);
	}
})

//bind the username getter
d3.select('#username').on("keyup",getUsername);

//resize events
window.addEventListener('resize', resize);
window.addEventListener('load',resize);

//version options
d3.select('#versionOptions').selectAll('input').on('change',switchVersions);

//move the tooltip
// window.addEventListener('mousemove', function(){
// 	d3.select('#tooltip')
// 		.style('left', event.pageX)
// 		.style('top',event.pageY-20)
// });

//define the params object that holds all the global variables and functions
defineParams();

//read in the answer key
loadAnswers();

//load data from the URL to define the form input
readURLdata();

//add the dropdowns for each selection word
createDropdowns();

//create the skeleton of the visualization (will be filled in at loadResponses)
//this is now called on reload
//createBars();

//load the responses to check if username already exists
//the visualization will not fill in until the user submits (this is now a recurring call and only executed after the first submit)
loadResponses(params.surveyFile);