//attach function to buttons
document.getElementById('SDCEditButton').onclick = beginSDCEdit;
document.getElementById('SDCDoneButton').onclick = endSDCEdit;
params.haveSDCEditor = true;
//params.SDCSubmitted = true;

//need a button to change the view from the "answers" to the most popular

function beginSDCEdit(){
	console.log('editing SDC');

	//change button to done
	d3.select('#SDCEditButton').style('display','none');
	d3.select('#SDCDoneButton').style('display','block');

	//I think once you click edit, all the lines should be removed, and then also you won't be able to change the version anymore
	d3.select('#SDCVersion1').style('visibility','hidden');
	d3.select('#SDCVersion1label').style('visibility','hidden');
	d3.select('#SDCVersion2').style('visibility','hidden');
	d3.select('#SDCVersion2Label').style('visibility','hidden');
	d3.select('#SDCAnswerToggle').style('visibility','hidden');
	d3.select('#SDCAnswerToggleLabel').style('visibility','hidden');
	d3.select('#SDCVersionOptions').style('visibility','hidden');
	d3.selectAll('line').remove();
	d3.selectAll('circle').remove();
	d3.selectAll('.SDCAggregateFracBox').remove();


	//update the url to remove all the connections
	params.URLInputValues = {};
	resetURLdata();
	params.URLInputValues['groupname'] = params.groupname;
	appendURLdata();

	//turn off the ability to draw lines
	d3.selectAll('.SDCrectContainer').on('mousedown', null);

	//add the ability to move the rects
	//the transform defines the position (so that I can move the rect and text)
	//the x,y attributes are used to connect the lines
	var deltaX, deltaY;
	var dragHandler = d3.drag()
		.on("start", function () {
			var trans = parseTranslateAttr(this);
			deltaX = trans.x - event.x;
			deltaY = trans.y - event.y;
		})
		.on("drag", function(){
			d3.select(this)
				.attr('x', event.x + deltaX)
				.attr('y', event.y + deltaY)
				.attr('transform', 'translate(' + (event.x + deltaX) + ',' + (event.y + deltaY) + ')')
		});
	
	dragHandler(params.SDCSVG.selectAll('.SDCrectContainer'));
}

function endSDCEdit(){
	console.log('done editing SDC');

	//change button to edit
	d3.select('#SDCEditButton').style('display','block');
	d3.select('#SDCDoneButton').style('display','none');

	//allow the user to make new responses, but not show any of the other options
	d3.select('#SDCVersionOptions').style('visibility','visible');

	//allow the user to add lines
	d3.selectAll('.SDCrectContainer').on('mousedown', startSDCLine);

	//remove the availity to drag the rects
	params.SDCSVG.selectAll('.SDCrectContainer').on('mousedown.drag', null);
}
