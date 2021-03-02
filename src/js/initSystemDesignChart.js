function createSystemDesignChart(){
	console.log('creating system design chart ...');

	//get the column centers
	var n = params.options.length - 1;
	var w = (window.innerWidth - 80)/n;
	var offset = w/2;
	params.SDCcolumnCenters = {};
	params.options.forEach(function(d,i){
		if (d != 'Select Category') params.SDCcolumnCenters[d] = (i-1)*w + offset
	})

	var boxWidth = 0.6*w - params.SDCboxMargin;
	var boxHeight = 40; //will need to modify this below for each box, based on text size

	//destroy the plot (if it exists)
	var parent = d3.select('#systemDesignChartSVGContainer').node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	//plot size and margins; I may have to resize this later once I know how many entries go in each column
	params.SDCSVGMargin = {"top":20,"bottom":20,"left":20,"right":20};
	params.SDCSVGHeight = 0.9*window.innerHeight - params.SDCSVGMargin.top - params.SDCSVGMargin.bottom;
	params.SDCSVGWidth = window.innerWidth-40 - params.SDCSVGMargin.left - params.SDCSVGMargin.right;

	
	params.SDCSVG = d3.select('#systemDesignChartSVGContainer').append('svg')
		.style('height',params.SDCSVGHeight + params.SDCSVGMargin.top + params.SDCSVGMargin.bottom)
		.style('width',params.SDCSVGWidth + params.SDCSVGMargin.left + params.SDCSVGMargin.right)
		.append("g")
			.attr("id","SDCPlotContainer")
			.attr("transform", "translate(" + params.SDCSVGMargin.left + "," + params.SDCSVGMargin.top + ")");


	// add the column headers
	params.SDCSVG.selectAll('.text')
		.data(params.options).enter().filter(function(d){return d != 'Select Category';})
		.append('text')
			.attr('class', function(d){ return 'text '+d+'Word'; })
			.attr("x", function(d) { return params.SDCcolumnCenters[d]; })
			.attr("y", 0)
			.attr("dy", ".35em")
			.style("text-anchor", "middle")
			.style('opacity',1)
			.text(function(d){return d})


	// It looks like I need to do this in a for loop so that I can get the proper y positions
	var SDCcolumnLocations = {};
	params.options.forEach(function(d){
		if (d != 'Select Category') SDCcolumnLocations[d] = params.SDCboxMargin;
	})
	for (var i=0; i<params.selectionWords.length; i++){
		var d = params.cleanString(params.selectionWords[i]);

		var box = params.SDCSVG.append('g')
			.attr('class','SDCrectContainer' + params.answers[0][d])
			.attr('x',params.SDCcolumnCenters[params.answers[0][d]] - boxWidth/2.)
			.attr('y',SDCcolumnLocations[params.answers[0][d]])
			.attr("transform", "translate(" + (params.SDCcolumnCenters[params.answers[0][d]] - boxWidth/2.) + "," + SDCcolumnLocations[params.answers[0][d]] + ")")

		box.append('rect')
			.attr('class','SDCrect ' + params.answers[0][d]+'Word')
			.attr('x',0)
			.attr('y', 0)
			.attr('width', boxWidth)
			.attr('height', boxHeight) //will need to update this


		var text = box.append('text')
			.attr("x", boxWidth/2.)
			.attr("y", boxHeight/2.)
			.attr("dy", ".35em")
			.style("text-anchor", "middle")
			.style('opacity',1)
			.style('fill','black')
			.text(params.selectionWords[i].replaceAll('<sub>','_').replaceAll('</sub>','$')) //recoding so the line width is about correct
			.call(wrapSVGtext, boxWidth-10)

		//fix any subcripts
		text.selectAll('tspan').each(function(){
			var t = d3.select(this).text()
			d3.select(this).html(t.replaceAll("_","<tspan dy=5>").replaceAll("$","</tspan><tspan dy=-5>"));  //I'm not closing the last tspan, but it seems OK 

		})


		//get the text height and resize the box
		var bbox = text.node().getBBox();
		box.select('rect').attr('height',bbox.height+10)
		SDCcolumnLocations[params.answers[0][d]] += bbox.height+10 + params.SDCboxMargin;// - boxHeight;

	}

	//now shift each column vertically so they are centered
	var maxH = 0;
	params.options.forEach(function(d,i){
		//get the max height
		if (d != 'Select Category') {
			if (SDCcolumnLocations[d] > maxH) maxH = SDCcolumnLocations[d];
		}
		//now shift as needed
		if (i == params.options.length-1){
			params.options.forEach(function(dd,j){
				if (dd != 'Select Category') {
					if (SDCcolumnLocations[dd] < maxH){
						var offset = (maxH - SDCcolumnLocations[dd])/2.;
						d3.selectAll('.SDCrectContainer'+dd).each(function(){
							var y = parseFloat(d3.select(this).attr('y')) + offset
							var x = d3.select(this).attr('x')
							d3.select(this).attr("transform", "translate(" + x + ","+ y + ")");
						})
					}
				}
			})
		}
	})



}