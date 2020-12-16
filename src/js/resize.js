//I can improve this, especially for mobile
function resize(){
	var bbox = d3.select('#plotContainer').node().getBBox();

	var rightWidth = bbox.width + 100;
	var leftWidth = window.innerWidth - rightWidth;

	d3.selectAll('.rightColumn').style('width',rightWidth);

	if (leftWidth > params.minWidth){
		d3.selectAll('.rightColumn').style('left',leftWidth);
		d3.selectAll('.leftColumn').style('width',leftWidth);
		d3.select('.centerLine').style('left',leftWidth);
	}

}