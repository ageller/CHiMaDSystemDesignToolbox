
//hide dropdowns when you click out
d3.select('body').on('click',function(){
	//if (!event.target.parentNode.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWordDropdown')){ 
	if (!event.target.classList.contains('selectionWord') && !event.target.parentNode.classList.contains('selectionWord')){ 
		d3.selectAll('select').classed('hidden', true);
	}
})

//bind the username getter
d3.select('#username').on("keyup",getUsername);

//resize events
window.addEventListener('resize', resize);
window.addEventListener('load',resize);

//version options
d3.select('#paraVersionOptions').selectAll('input').on('change',switchParaVersions);
d3.select('#SDCVersionOptions').selectAll('input').on('change',switchSDCVersions);

//move the tooltip
// window.addEventListener('mousemove', function(){
// 	d3.select('#tooltip')
// 		.style('left', event.pageX)
// 		.style('top',event.pageY-20)
// });

//for line drawing
window.addEventListener('mousemove', function(){
	params.event = window.event;
	moveSDCLine();
});
window.addEventListener('mouseup', function(){
	endSDCLine();
	params.mouseDown = false;
});
window.addEventListener('mousedown', function(){
	params.mouseDown = true;
});

//define the params object that holds all the global variables and functions
defineParams();

//get all the words for selecting
params.selectionWords = [];
d3.selectAll('.selectionWord').select('text').each(function(d){
	params.selectionWords.push(this.innerHTML);
})

//read in the answer key
loadAnswers();

//load data from the URL to define the form input
readURLdata();

//add the dropdowns for each selection word
createDropdowns();

//create the skeleton of the visualization (will be filled in at loadResponses)
//this is now called on reload
//createBars();

//create the skeleton of the system design chart
//using answers now, and will call this within reload (but will this always happen after loadAnswers?)
//createSystemDesignChart();

//load the responses to check if username already exists
//the visualization will not fill in until the user submits (this is now a recurring call and only executed after the first submit)
loadResponses(params.surveyFile);