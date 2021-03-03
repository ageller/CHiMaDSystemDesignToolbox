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

	params.SDCboxWidth = 0.6*w - params.SDCboxMargin;
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
		.attr("id","SDCPlotSVG")
		.style('height',params.SDCSVGHeight + params.SDCSVGMargin.top + params.SDCSVGMargin.bottom)
		.style('width',params.SDCSVGWidth + params.SDCSVGMargin.left + params.SDCSVGMargin.right)
		.append("g")
			.attr("id","SDCPlotContainer")
			.attr("transform", "translate(" + params.SDCSVGMargin.left + "," + params.SDCSVGMargin.top + ")");


	//create a rect to capture mouse events
	params.SDCSVG.append('rect')
		.attr('id','SDCmouseEvents')
		.attr('x',0)
		.attr('y',0)
		.attr('fill','none')
		.attr('width',params.SDCSVGWidth)
		.attr('height',params.SDCSVGHeight)
		.on('mouseup',endSDCLine)

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
			.attr('class','SDCrectContainer ' + params.answers[0][d])
			.attr('x',params.SDCcolumnCenters[params.answers[0][d]] - params.SDCboxWidth/2.)
			.attr('y',SDCcolumnLocations[params.answers[0][d]])
			.attr("transform", "translate(" + (params.SDCcolumnCenters[params.answers[0][d]] - params.SDCboxWidth/2.) + "," + SDCcolumnLocations[params.answers[0][d]] + ")")

		box.append('rect')
			.attr('class','SDCrect ' + params.answers[0][d]+'Word ' + params.answers[0][d])
			.attr('x',0)
			.attr('y', 0)
			.attr('width', params.SDCboxWidth)
			.attr('height', boxHeight) //will need to update this
			.on('mousedown', startSDCLine)


		var text = box.append('text')
			.attr("x", params.SDCboxWidth/2.)
			.attr("y", boxHeight/2.)
			.attr("dy", ".35em")
			.style("text-anchor", "middle")
			.style('opacity',1)
			.style('fill','black')
			.text(params.selectionWords[i].replaceAll('<sub>','_').replaceAll('</sub>','$')) //recoding so the line width is about correct
			.call(wrapSVGtext, params.SDCboxWidth-10)

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
						d3.selectAll('.SDCrectContainer.'+dd).each(function(){
							var y = parseFloat(d3.select(this).attr('y')) + offset
							var x = d3.select(this).attr('x')
							d3.select(this)
								.attr('x',x)
								.attr('y',y)
								.attr("transform", "translate(" + x + ","+ y + ")");
						})
					}
				}
			})
		}
	})

}

//draw lines 
//http://jsfiddle.net/9tr7w/360/
function startSDCLine() {
	//get right side of box
	var elem = this;
	//if on top of the circle
	if (elem.classList.contains('SDCCircle0')){
		elem = document.elementFromPoint(params.event.clientX -7, params.event.clientY);
		if (elem.nodeName == 'tspan') elem = elem.parentNode;
	}
	var parent = d3.select(elem.parentNode);
	var x = parseFloat(parent.attr('x')) + params.SDCboxWidth;
	var y = parseFloat(parent.attr('y')) + parseFloat(d3.select(elem).attr('height'))/2.;

	//get the category from the rect class list (will this always be the last class value?)
	var cat = parent.node().classList[1]
	var i = params.options.indexOf(cat);
	if (i < params.options.length-1){
		params.SDCLineIndex += 1;

		params.SDCLine = params.SDCSVG.append("line")
			.attr('attached','false') //custom attribute to track if the line is connected
			.attr('startCategory',cat) //custom attribute to track the starting category
			.attr('endCategory','null') //custom attribute to track the ending category
			.attr('id','SDCLine_'+params.SDCLineIndex)
			.attr('stroke','black')
			.attr('stroke-width',4)
			.attr("x1", x)
			.attr("y1", y)
			.attr("x2", x)
			.attr("y2", y)
			.on('mousedown', moveExistingSDCLine);

		params.SDCCircle0 = params.SDCSVG.append("circle")
			.attr('id','SDCCircle0_'+params.SDCLineIndex)
			.attr('class','SDCCircle0')
			.attr('fill', 'black')
			.attr('cx',x)
			.attr('cy',y)
			.attr('r',6)
			.on('mousedown', startSDCLine);

		params.SDCCircle = params.SDCSVG.append("circle")
			.attr('id','SDCCircle_'+params.SDCLineIndex)
			.attr('class','SDCCircle')
			.attr('fill', 'black')
			.attr('cx',x)
			.attr('cy',y)
			.attr('r',6)
			.on('mousedown', moveExistingSDCLine);

	}
}

function moveSDCLine() {
	if (params.SDCLine){
		//stop text highlighting
		window.event.cancelBubble = true;
		window.event.returnValue = false;

		var x = params.event.layerX - params.SDCSVGMargin.left;
		var y = params.event.layerY - params.SDCSVGMargin.top;

		//snap to object if close enough
		var elem = document.elementFromPoint(params.event.clientX + 20, params.event.clientY);
		var attached = false;
		if (elem){
			//check parents for tspan
			if (elem.nodeName == 'tspan') elem = elem.parentNode;
			var parent = d3.select(elem.parentNode);
			if (parent.classed('SDCrectContainer')){
				//get the category from the rect class list (will this always be the last class value?)
				var cat = parent.node().classList[1];
				var cat0 = params.SDCLine.attr('startCategory');
				
				//check if this is an adjacent category to the starting point
				var adjacent = false;
				var i = params.options.indexOf(cat);
				var i0 = params.options.indexOf(cat0);
				if (i - i0 == 1) adjacent = true;
				if (adjacent){
					attached = true;
					//get left side of box
					x = parseFloat(parent.attr('x'));
					y = parseFloat(parent.attr('y')) + parseFloat(parent.select('.SDCrect').attr('height'))/2.;
					params.SDCLine
						.attr('attached','true')
						.attr('endCategory', cat);
				}
			} 
		}
		if (!attached){
			params.SDCLine
				.attr('attached','false')
				.attr('endCategory', 'null');
		}
		

		params.SDCLine
			.attr("x2", x)
			.attr("y2", y);

		params.SDCCircle
			.attr("cx", x)
			.attr("cy", y);
	}

}

function moveExistingSDCLine(){
	var useIndex = this.id.split('_')[1];
	params.SDCLine = d3.select('#SDCLine_'+useIndex)
	params.SDCCircle = d3.select('#SDCCircle_'+useIndex)
}

function endSDCLine() {
	//restart text highlighting
	window.event.cancelBubble = false;
	window.event.returnValue = true;
	
	//delete line if not attached
	if (params.SDCLine){
		if (params.SDCLine.attr('attached') != 'true'){
			params.SDCLine.remove();
			params.SDCCircle0.remove();
			params.SDCCircle.remove();
		}
	}

	params.SDCLine = null;
	params.SDCCircle0 = null;
	params.SDCCircle = null;


}
