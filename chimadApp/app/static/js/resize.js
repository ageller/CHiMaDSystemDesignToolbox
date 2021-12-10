//I can improve this, especially for mobile
function resize(){
	
	var topH = d3.select('#branding').node().getBoundingClientRect().height + 20;

	if (params.haveBars && params.createdBars) resizeBarPlot();

	var elem;

	//change font sizes
	d3.selectAll('.button').style('font-size', Math.max(0.009*window.innerWidth, params.buttonFSmin) + 'px');
	d3.selectAll('.secondaryButton').style('font-size', Math.max(0.009*window.innerWidth, params.buttonFSmin) + 'px');
	var fsp = Math.max(0.01*window.innerWidth, params.paraFSmin);
	d3.selectAll('.para')
		.style('font-size', fsp + 'px')
		.style('line-height', (fsp+18)+'px');
	var fsi = Math.max(0.008*window.innerWidth, params.instructionsFSmin);
	d3.selectAll('.instructions')
		.style('font-size', fsi + 'px')
		.style('line-height', (fsi+4)+'px');
	d3.selectAll('.notifications')
		.style('font-size', fsi + 'px')
		.style('line-height', (fsi+4)+'px')
		.style('min-height', (fsi+4)+'px');
	var fsv = Math.max(0.007*window.innerWidth, params.versionFSmin);
	d3.selectAll('.versionOptions')
		.style('font-size', fsv + 'px')
		.style('line-height', (fsv+2)+'px');

	d3.select('#boxGridNResponses')
		.style('font-size', fsi + 'px')
		.style('line-height', (fsi+4)+'px');
	d3.select('#SDCNResponses')
		.style('font-size', fsi + 'px')
		.style('line-height', (fsi+4)+'px');
			
	d3.select('#paragraphForm').style('margin-top',topH + 'px');
	var paragraphFormBbox = d3.select('#paragraphForm').node().getBoundingClientRect();
	var maxH = paragraphFormBbox.height + topH;

	//for now I'm disabling this entire section unless we are showing the bar chart
	if (params.haveBars && params.createdBars) {

		var boxGridWidth = 	Math.max(params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right, params.minPlotWidth);
		d3.select('#boxGrid').style('width', boxGridWidth + 'px');

		var plotBbox = d3.select('#boxGridPlotContainer').node().getBBox();
		var boxGridBbox = d3.select('#boxGrid').node().getBoundingClientRect();
	 
		var paragraphFormWidth = window.innerWidth - boxGridWidth - 100;

		//should I be more careful about this?  Or maybe resize the plot first?
		d3.select('#boxGrid').style('width',boxGridWidth);

		console.log('resize check', boxGridWidth, window.innerWidth - boxGridWidth, window.innerWidth)

		//check which view we will use
		//if (plotSSWidth >= params.minPlotWidth && (window.innerWidth - plotSSWidth >= params.minParaWidth) ){
		if (window.innerWidth - boxGridWidth >= params.minParaWidth){
			console.log('resize side-by-side view')
			//side-by-side view
			d3.select('#paragraphForm').style('width',paragraphFormWidth);
			d3.select('#boxGrid')
				.style('left',paragraphFormWidth + 'px')
				.style('margin-top','0px')
				.style('top',topH+'px');
			boxGridBbox = d3.select('#boxGrid').node().getBoundingClientRect();
			maxH = Math.max(Math.max(plotBbox.height, boxGridBbox.height), paragraphFormBbox.height) + topH;
			d3.select('#verticalLine1')
				.style('display','block')
				.style('left',paragraphFormWidth + 'px')
				.style('top',topH + 'px')
				//.style('height', 0.98*Math.max(window.innerHeight,boxGridBbox.height));
				.style('height', (maxH - 0.01*window.innerHeight - topH + 12) + 'px')
			d3.select('#horizontalLine1').style('display','none');
			d3.select('#horizontalLine2') 
				.style('display','block')
				.style('top',maxH+'px');

		} else {
			//top-bottom view
			console.log('resize top-bottom view', paragraphFormBbox.height, paragraphFormBbox, d3.select('#paragraphForm').node())
			d3.select('#paragraphForm').style('width',(window.innerWidth-20) + 'px');
			paragraphFormBbox = d3.select('#paragraphForm').node().getBoundingClientRect();
			d3.select('#boxGrid')
				.style('left',0)
				.style('top',paragraphFormBbox.height + topH + 50 + 'px')
				.style('margin-top','0px')
				.style('width',paragraphFormBbox.width + 'px')
			d3.select('#verticalLine1').style('display','none');
			d3.select('#horizontalLine1')			
				.style('display','block')
				.style('top',paragraphFormBbox.height+ topH + 'px');
			maxH = paragraphFormBbox.height + topH + Math.max(plotBbox.height, boxGridBbox.height) + 80;
			d3.select('#horizontalLine2')			
				.style('display','block')
				.style('top',maxH+'px');
		}
	}


	//for now I will just move the system design chart to the bottom (but might want to make it possible to do side-by-side?)
	// var plotBbox = d3.select('#boxGridPlotContainer').node().getBBox();
	// var boxGridBbox = d3.select('#boxGrid').node().getBoundingClientRect();
	// var paragraphFormBbox = d3.select('#paragraphForm').node().getBoundingClientRect();
	if (params.haveSDC){
		d3.select('#systemDesignChart').style('top',maxH + 20 +'px');
		if ((params.answersParagraphnames.para.includes(params.cleanString(params.paragraphname)) && params.paraSubmitted2 && params.haveSDC) || params.haveParaEditor || (params.haveSDCEditor && !params.editingSDC)) {
			createSystemDesignChart();
			createHistogram(params.SDCHist);	
		}
	}

}