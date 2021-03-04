function createSystemDesignChart(){
	console.log('creating system design chart ...');

	//get the column centers
	var n = params.options.length - 1;
	var w = (window.innerWidth - 80)/n;
	var offset = w/2;
	params.SDCColumnCenters = {};
	params.options.forEach(function(d,i){
		if (d != 'Select Category') params.SDCColumnCenters[d] = (i-1)*w + offset
	})

	params.SDCBoxWidth = 0.6*w - params.SDCBoxMargin;
	var boxHeight = 40; //will need to modify this below for each box, based on text size

	//destroy the plot (if it exists)
	var parent = d3.select('#systemDesignChartSVGContainer').node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	//plot size and margins; I may have to resize this later once I know how many entries go in each column
	params.SDCSVGMargin = {'top':20,'bottom':20,'left':20,'right':20};
	params.SDCSVGHeight = 0.9*window.innerHeight - params.SDCSVGMargin.top - params.SDCSVGMargin.bottom;
	params.SDCSVGWidth = window.innerWidth-40 - params.SDCSVGMargin.left - params.SDCSVGMargin.right;

	
	params.SDCSVG = d3.select('#systemDesignChartSVGContainer').append('svg')
		.attr('id','SDCPlotSVG')
		.style('height',params.SDCSVGHeight + params.SDCSVGMargin.top + params.SDCSVGMargin.bottom)
		.style('width',params.SDCSVGWidth + params.SDCSVGMargin.left + params.SDCSVGMargin.right)
		.append('g')
			.on('mouseup',resetSDCLines)
			.attr('id','SDCPlotContainer')
			.attr('transform', 'translate(' + params.SDCSVGMargin.left + ',' + params.SDCSVGMargin.top + ')');


	//create a rect to capture mouse events
	params.SDCSVG.append('rect')
		.attr('id','SDCmouseEvents')
		.attr('x',0)
		.attr('y',0)
		.attr('fill','none')
		.attr('width',params.SDCSVGWidth)
		.attr('height',params.SDCSVGHeight)
		.on('mouseup',endSDCLine)

	//will hold the aggregate results
	params.SDCAggSVG = params.SDCSVG.append('g').attr('id','AggregatedSDCLinesContainer');

	// add the column headers
	params.SDCSVG.selectAll('.text')
		.data(params.options).enter().filter(function(d){return d != 'Select Category';})
		.append('text')
			.attr('class', function(d){ return 'text '+d+'Word'; })
			.attr('x', function(d) { return params.SDCColumnCenters[d]; })
			.attr('y', 0)
			.attr('dy', '.35em')
			.style('text-anchor', 'middle')
			.style('opacity',1)
			.text(function(d){return d})


	// It looks like I need to do this in a for loop so that I can get the proper y positions
	var SDCcolumnLocations = {};
	params.options.forEach(function(d){
		if (d != 'Select Category') SDCcolumnLocations[d] = params.SDCBoxMargin;
	})
	for (var i=0; i<params.selectionWords.length; i++){
		var d = params.cleanString(params.selectionWords[i]);

		var box = params.SDCSVG.append('g')
			.attr('class','SDCrectContainer ' + params.answers[0][d])
			.attr('id','SDCBox_'+params.cleanString(params.selectionWords[i]))
			.attr('selectionWords',params.cleanString(params.selectionWords[i])) //custom attribute to hold the selection words
			.attr('x',params.SDCColumnCenters[params.answers[0][d]] - params.SDCBoxWidth/2.)
			.attr('y',SDCcolumnLocations[params.answers[0][d]])
			.attr('transform', 'translate(' + (params.SDCColumnCenters[params.answers[0][d]] - params.SDCBoxWidth/2.) + ',' + SDCcolumnLocations[params.answers[0][d]] + ')')
			//.on('mouseover',function(){highlightSDCLines(this)})
			//.on('mouseout',resetSDCLines)
			.on('mousedown', startSDCLine)

		box.append('rect')
			.attr('class','SDCrect ' + params.answers[0][d]+'Word ' + params.answers[0][d])
			.attr('x',0)
			.attr('y', 0)
			.attr('width', params.SDCBoxWidth)
			.attr('height', boxHeight) //will need to update this


		var text = box.append('text')
			.attr('class','noSelect')
			.attr('x', params.SDCBoxWidth/2.)
			.attr('y', boxHeight/2.)
			.attr('dy', '.35em')
			.style('text-anchor', 'middle')
			.style('opacity',1)
			.style('fill','black')
			.text(params.selectionWords[i].replaceAll('<sub>','_').replaceAll('</sub>','$')) //recoding so the line width is about correct
			.call(wrapSVGtext, params.SDCBoxWidth-10)

		//add the mouse event
		//text.selectAll('tspan').on('mousedown', startSDCLine)

		//fix any subcripts
		text.selectAll('tspan').each(function(){
			var t = d3.select(this).text()
			d3.select(this).html(t.replaceAll('_','<tspan dy=5>').replaceAll('$','</tspan><tspan dy=-5>'));  //I'm not closing the last tspan, but it seems OK 

		})


		//get the text height and resize the box
		var bbox = text.node().getBBox();
		box.select('rect').attr('height',bbox.height+10)
		SDCcolumnLocations[params.answers[0][d]] += bbox.height+10 + params.SDCBoxMargin;// - boxHeight;

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
								.attr('transform', 'translate(' + x + ','+ y + ')');
						})
					}
				}
			})
		}
	})

	useSDCURLdata();

	//for testing
	if (params.SDCSubmitted)plotSDCAggregateLines();


}

function createSDCLine(elem,x1,y1,x2,y2,r,cat,startWords,endWords){
	params.SDCLineIndex += 1;

	params.SDCLine = params.SDCSVG.append('line')
		.attr('attached','false') //custom attribute to track if the line is connected
		.attr('startCategory',cat) //custom attribute to track the starting category
		.attr('endCategory','null') //custom attribute to track the ending category
		.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
		.attr('endSelectionWords',endWords) //custom attribute to track the ending word(s)			
		.attr('id','SDCLine_'+params.SDCLineIndex)
		.attr('class','SDCLine SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('stroke','black')
		.attr('stroke-width',4)
		.attr('x1', x1)
		.attr('y1', y1)
		.attr('x2', x2)
		.attr('y2', y2)
		.on('mousedown', moveExistingSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle0 = params.SDCSVG.append('circle')
		.attr('id','SDCCircle0_'+params.SDCLineIndex)
		.attr('class','SDCCircle0 SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', 'black')
		.attr('cx',x1)
		.attr('cy',y1)
		.attr('r',r)
		.on('mousedown', startSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle = params.SDCSVG.append('circle')
		.attr('id','SDCCircle_'+params.SDCLineIndex)
		.attr('class','SDCCircle SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', 'black')
		.attr('cx',x2)
		.attr('cy',y2)
		.attr('r',r)
		.on('mousedown', moveExistingSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

}

//draw lines 
function startSDCLine() {
	//get right side of box
	var elem = this;
	if (elem.nodeName == 'tspan') elem = d3.select(elem.parentNode.parentNode).select('rect').node().parentNode;
	//if on top of the circle
	if (elem.classList.contains('SDCCircle0')){
		elem = document.elementFromPoint(params.event.clientX -7, params.event.clientY).parentNode;
		if (elem.nodeName == 'tspan') elem = d3.select(elem.parentNode.parentNode).select('rect').node().parentNode;
	}
	highlightSDCLines(elem)

	elem = d3.select(elem);
	var x = parseFloat(elem.attr('x')) + params.SDCBoxWidth;
	var y = parseFloat(elem.attr('y')) + parseFloat(elem.select('rect').attr('height'))/2.;

	//get the category from the rect class list (will this always be the last class value?)
	var cat = elem.node().classList[1]
	var words = elem.attr('selectionWords')
	var i = params.options.indexOf(cat);
	if (i < params.options.length-1 && !isNaN(x) && !isNaN(y)) createSDCLine(elem, x,y,x,y,6,cat,words,'null');

}

function moveSDCLine() {
	if (params.SDCLine){
		//stop text highlighting
		window.event.cancelBubble = true;
		window.event.returnValue = false;

		//for highlighting
		var id = 'SDCBox_'+params.SDCLine.attr('startSelectionWords')
		highlightSDCLines(d3.select('#'+id).node());

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
				
				var words = parent.attr('selectionWords')

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
						.attr('endCategory', cat)
						.attr('endSelectionWords',words);
				}
			} 
		}
		if (!attached){
			params.SDCLine
				.attr('attached','false')
				.attr('endCategory', 'null')
				.attr('endSelectionWords','null');

		}
		

		var x1 = params.SDCLine.attr('x1')
		var y1 = params.SDCLine.attr('y1')
		if (x < x1){
			x = x1;
			y = y1
		}
		params.SDCLine
			.attr('x2', x)
			.attr('y2', y);

		params.SDCCircle
			.attr('cx', x)
			.attr('cy', y);

	}

}

function moveExistingSDCLine(){
	var useIndex = this.id.split('_')[1];
	params.SDCLine = d3.select('#SDCLine_'+useIndex)
	params.SDCCircle = d3.select('#SDCCircle_'+useIndex)
	params.SDCCircle0 = d3.select('#SDCCircle0_'+useIndex)
}

function endSDCLine() {
	//add to the url

	//restart text highlighting
	window.event.cancelBubble = false;
	window.event.returnValue = true;
	
	if (params.SDCLine){
		if (params.SDCLine.attr('attached') == 'true'){
			//add to URL
			var word1 = 'SDC'+params.SDCLine.attr('startSelectionWords');
			var word2 = params.SDCLine.attr('endSelectionWords');
			if (word1 in params.URLInputValues){
				word2 = params.URLInputValues[word1];
				if (!params.URLInputValues[word1].includes(params.SDCLine.attr('endSelectionWords'))) word2 += '%20'+params.SDCLine.attr('endSelectionWords');
			} 
			params.URLInputValues[word1] = word2;
			appendURLdata();
		} else {
			//delete line if not attached
			params.SDCLine.remove();
			params.SDCCircle0.remove();
			params.SDCCircle.remove();
		}
	}

	params.SDCLine = null;
	params.SDCCircle0 = null;
	params.SDCCircle = null;

	resetSDCLines();

}

function highlightSDCLines(elem){
	if (!params.SDCLineHighlighted){
		params.SDCLineHighlighted = true;
		// d3.selectAll('.SDCLine').interrupt().transition()
		// d3.selectAll('.SDCCircle').interrupt().transition()
		// d3.selectAll('.SDCCircle0').interrupt().transition()

		d3.selectAll('.SDCLine').transition().duration(params.transitionSDCDuration).style('opacity',0.1)
		d3.selectAll('.SDCCircle').transition().duration(params.transitionSDCDuration).style('opacity',0.1)
		d3.selectAll('.SDCCircle0').transition().duration(params.transitionSDCDuration).style('opacity',0.1)

		var foo = d3.select(elem).attr('id')
		var id = foo.substr(7,foo.length-7);
		d3.selectAll('.SDCLine_'+id).interrupt().transition()
		d3.selectAll('.SDCLine_'+id).style('opacity',1)

		d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionSDCDuration).style('opacity',0.1);
		d3.selectAll('.SDCAggregateLine_'+id).interrupt().transition()
		d3.selectAll('.SDCAggregateLine_'+id).style('opacity',0.5)

		d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').interrupt().transition()
		d3.selectAll('.SDCAggregateFracBox_'+id).select('text').interrupt().transition()
		d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').transition().duration(params.transitionSDCDuration).style('opacity',0.5)
		d3.selectAll('.SDCAggregateFracBox_'+id).select('text').transition().duration(params.transitionSDCDuration).style('opacity',1)

	}

}
function resetSDCLines(){
	params.SDCLineHighlighted = false;

	d3.selectAll('.SDCLine').transition().duration(params.transitionSDCDuration).style('opacity',1);
	d3.selectAll('.SDCCircle').transition().duration(params.transitionSDCDuration).style('opacity',1);
	d3.selectAll('.SDCCircle0').transition().duration(params.transitionSDCDuration).style('opacity',1);

	d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionSDCDuration).style('opacity',0.5);

	d3.selectAll('.SDCAggregateFracBox').select('rect').transition().duration(params.transitionSDCDuration).style('opacity',0)
	d3.selectAll('.SDCAggregateFracBox').select('text').transition().duration(params.transitionSDCDuration).style('opacity',0)
}

function useSDCURLdata(){
	//remove all the lines
	d3.selectAll('.SDCLine').remove();
	d3.selectAll('.SDCCircle0').remove();
	d3.selectAll('.SDCCircle').remove();

	//apply the form data from the URL
	var keys = Object.keys(params.URLInputValues);
	keys.forEach(function(k){
		if (k.substring(0,3) == 'SDC'){
			var startWords = k.substring(3,k.length);
			var endWords = decodeURI(params.URLInputValues[k]).split(' ');
			//console.log('using', k, params.URLInputValues[k], startWords, endWords);

			endWords.forEach(function(w,i){

				var startParent = d3.select('#SDCBox_'+startWords);
				var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth;
				var y1 = parseFloat(startParent.attr('y')) + parseFloat(startParent.select('rect').attr('height'))/2.;

				var endParent = d3.select('#SDCBox_'+w);
				var x2 = parseFloat(endParent.attr('x'))
				var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height'))/2.;

				//get the category from the rect class list (will this always be the last class value?)
				var cat = startParent.node().classList[1]

				if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) createSDCLine(startParent.node(), x1,y1,x2,y2,6,cat,startWords,w);
				params.SDCLine = null;
				params.SDCCircle0 = null;
				params.SDCCircle = null;
			})


		}

	})
}

function plotSDCAggregateLines(){

	//destroy the plot (if it exists)
	var parent = params.SDCAggSVG.node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	var fracBoxSize = 20;//should this change with resize?

	var SDCdata = params.aggregatedSDCResponses[params.SDCResponseVersion];
	Object.keys(SDCdata).forEach(function(startWords){
		var endWords = SDCdata[startWords].uniq;

		endWords.forEach(function(w,i){

			var startParent = d3.select('#SDCBox_'+startWords);
			var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth;
			var y1 = parseFloat(startParent.attr('y')) + parseFloat(startParent.select('rect').attr('height'))/2.;

			var endParent = d3.select('#SDCBox_'+w);
			var x2 = parseFloat(endParent.attr('x'))
			var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height'))/2.;

			//get the category from the rect class list (will this always be the last class value?)
			var cat = startParent.node().classList[1];

			//line width is based on entries
			var frac = SDCdata[startWords].num[w]/params.aggregatedSDCResponses.nVersion[params.SDCResponseVersion];
			var width = (params.maxSDCLineWidth - params.minSDCLineWidth)*frac + params.minSDCLineWidth;

			if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

				var line = params.SDCAggSVG.append('line')
					.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
					.attr('endSelectionWords',w) //custom attribute to track the ending word(s)			
					.attr('fracion',frac) //custom attribute to track the fraction		
					.attr('id','SDCAggregateLine_'+params.SDCLineIndex)
					.attr('class','SDCAggregateLine SDCAggregateLine_'+startWords+ ' SDCAggregateLine_'+w)
					.attr('stroke',params.colorMap(frac))
					.attr('stroke-width',width)
					.attr('stroke-linecap','round') 
					.attr('x1', x1)
					.attr('y1', y1)
					.attr('x2', x1)
					.attr('y2', y1)
					.style('opacity',0.5)
					.style('z-index',-10)

				line.transition().duration(params.transitionDuration)
					.attr('x2', x2)
					.attr('y2', y2)

				//also create a box and text to hold the fraction
				var textHolder = params.SDCAggSVG.append('g')
					.attr('class','SDCAggregateFracBox SDCAggregateFracBox_'+startWords+' SDCAggregateFracBox_'+w)

				var xt = (x1 + x2)/2.;
				var yt = (y1 + y2)/2.;
				var d = Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
				var angle = Math.acos(Math.abs(x2 - x1)/d)*180/Math.PI;
				var yoff = width;
				if (y1 > y2) angle = -1.*angle;
				
				// textHolder.append('rect')
				// 	.attr('fill',params.colorMap(frac))
				// 	.attr('x',xt - fracBoxSize*2.)
				// 	.attr('y',yt - fracBoxSize/2 - width)
				// 	.attr('rx', fracBoxSize/4.)
				// 	.attr('ry', fracBoxSize/4.)
				// 	.attr('width',fracBoxSize*2.)
				// 	.attr('height',fracBoxSize)
				// 	.attr('transform','rotate(' + angle + ',' + xt + ',' + yt + ')')
				// 	.style('opacity',0)


				textHolder.append('text')
					.attr('x',xt - fracBoxSize)
					.attr('y',yt - yoff)
					.attr('dy', '.35em')
					.attr('transform','rotate(' + angle + ',' + xt + ',' + yt + ')')
					.attr('fill','black')
					.style('text-anchor', 'middle')
					.style('opacity',0)
					.text(frac.toFixed(2))

			}
		})

	})

}

function switchSDCVersions(){
	if (this.name == 'version'){
		params.SDCResponseVersion = this.value;

		params.SDCAggSVG.selectAll('line').each(function(d,i){
			var el = d3.select(this)
			var t = el.transition().duration(params.transitionDuration)
				.attr('x1', el.attr('x2'))
				.attr('y1', el.attr('y2'))
			if (i == params.SDCAggSVG.selectAll('line').size() -1){
				t.on('end',function(){
					if (params.SDCSubmitted) plotSDCAggregateLines();
				})
			}
		})
			
	}

}