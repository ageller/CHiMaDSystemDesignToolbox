//I can improve this, especially for mobile
function resize(){
	
	//remake the plot.  Is there a more efficient way to do this?
	createBars();


	//change font sizes
	d3.selectAll('.button').style('font-size', Math.max(0.009*window.innerWidth, params.buttonFSmin) + 'px');
	var fsp = Math.max(0.01*window.innerWidth, params.paraFSmin);
	d3.selectAll('.para')
		.style('font-size', fsp + 'px')
		.style('line-height', (fsp+18)+'px');
	var fsi = Math.max(0.008*window.innerWidth, params.instructionsFSmin);
	d3.selectAll('.instructions')
		.style('font-size', fsi + 'px')
		.style('line-height', (fsi+4)+'px');
	var fsv = Math.max(0.007*window.innerWidth, params.versionFSmin);
	d3.select('#versionOptions')
		.style('font-size', fsv + 'px')
		.style('line-height', (fsv+2)+'px');

	var plotBbox = d3.select('#plotContainer').node().getBBox();
	var rightBbox = d3.select('#rightColumn').node().getBoundingClientRect();
	var leftBbox = d3.select('#leftColumn').node().getBoundingClientRect();
 
	var rightWidth = plotBbox.width;
	var leftWidth = window.innerWidth - rightWidth - 100;

	//should I be more careful about this?  Or maybe resize the plot first?
	d3.select('#rightColumn').style('width',rightWidth);

	var plotSSWidth = plotBbox.width;
	console.log('resize check', plotSSWidth, window.innerWidth - plotSSWidth, window.innerWidth)
	if (plotSSWidth >= params.minPlotWidth && (window.innerWidth - plotSSWidth >= params.minParaWidth) ){
		console.log('resize side-by-side view')
		//side-by-side view
		d3.select('#leftColumn').style('width',leftWidth);
		d3.select('#rightColumn')
			.style('left',leftWidth)
			.style('top',0);
		rightBbox = d3.select('#rightColumn').node().getBoundingClientRect();
		d3.select('#centerLine')
			.style('display','block')
			.style('left',leftWidth)
			.style('height', 0.98*Math.max(window.innerHeight,rightBbox.height));
	} else {
		//top-bottom view
		console.log('resize top-bottom view', leftBbox.height, leftBbox, d3.select('#leftColumn').node())
		d3.select('#leftColumn').style('width',(window.innerWidth-20) + 'px');
		leftBbox = d3.select('#leftColumn').node().getBoundingClientRect();
		d3.select('#rightColumn')
			.style('left',0)
			.style('top',leftBbox.height + 50 + 'px')
		d3.select('#centerLine').style('display','none');
	}




}