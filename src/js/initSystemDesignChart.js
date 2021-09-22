params.haveSDC = true;


//version options
d3.select('#SDCVersionOptions').selectAll('input').on('change',switchSDCVersions);

//for line drawing
window.addEventListener('mousemove', function(){
	moveSDCLine();
});
window.addEventListener('mouseup', function(){
	endSDCLine();
	params.mouseDown = false;
});
window.addEventListener('mousedown', function(){
	params.mouseDown = true;
});


function createSystemDesignChart(){
	if (!params.SDCLineHighlighted){
		console.log('creating system design chart ...', params.answersGroupnames);

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
		params.SDCAggSVG = params.SDCSVG.append('g').attr('id','SDCAggregatedLinesContainer');

		//will hold the aggregate results
		params.SDCAnswersSVG = params.SDCSVG.append('g').attr('id','SDCAnswersLinesContainer');

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
		//I will start with the boxes in random locations and without colors, then formatSDC will define the actual locations and colors if the answers are available

		for (var i=0; i<params.selectionWords.length; i++){
			var d = params.cleanString(params.selectionWords[i]);

			var x = Math.random()*(params.SDCSVGWidth - params.SDCBoxWidth);
			var y = Math.random()*(params.SDCSVGHeight - params.SDCBoxWidth) + 20;
			var box = params.SDCSVG.append('g')
				.attr('class','SDCrectContainer')
				.attr('id','SDCBox_'+params.cleanString(params.selectionWords[i]))
				.attr('selectionWords',params.cleanString(params.selectionWords[i])) //custom attribute to hold the selection words
				.attr('x',x)
				.attr('y',y)
				.attr('transform', 'translate(' + x + ',' + y + ')')

			box.append('rect')
				.attr('class','SDCrect')
				.attr('x',0)
				.attr('y', 0)
				.attr('width', params.SDCBoxWidth)
				.attr('height', boxHeight) //will need to update this
				.style('fill','white')

			var text = box.append('text')
				.attr('class','noSelect SDCtext')
				.attr('x', params.SDCBoxWidth/2.)
				.attr('y', boxHeight/2.)
				.attr('dy', '.35em')
				.attr('orgText',params.selectionWords[i].replaceAll('<sub>','_').replaceAll('</sub>','$')) //recoding so the line width is about correct
				.style('text-anchor', 'middle')
				.style('opacity',1)
				.style('fill','black')
				.text(params.selectionWords[i].replaceAll('<sub>','_').replaceAll('</sub>','$')) //recoding so the line width is about correct
				.call(wrapSVGtext, params.SDCBoxWidth-10)

			//fix any subcripts
			text.selectAll('tspan').each(function(){
				var t = d3.select(this).text()
				d3.select(this).html(t.replaceAll('_','<tspan dy=5>').replaceAll('$','</tspan><tspan dy=-5>'));  //I'm not closing the last tspan, but it seems OK 
			})

			//get the text height and resize the box
			var bbox = text.node().getBBox();
			box.select('rect').attr('height',bbox.height+10)

			//get the maximum width of the text and reformat all the boxes to that (in case there are really long words)
			var maxW = params.SDCBoxWidth;
			d3.selectAll('.SDCrectContainer').each(function(){
				var rbbox = d3.select(this).select('text').node().getBoundingClientRect();
				maxW = Math.max(maxW, rbbox.width + 6);
			})
			d3.selectAll('.SDcrect').attr('width', maxW);
			d3.selectAll('.SDCtext').selectAll('.wrappedSVGtext').attr('x', maxW/2.)

		}


		if (params.answersGroupnames.para.includes(params.groupname) && (params.paraSubmitted2 || params.haveParaEditor || params.haveSDCEditor)) formatSDC();

		if (params.SDCSubmitted || params.haveSDCEditor) {
			plotSDCAggregateLines();
			plotSDCAnswerLines();
		}
	}
}

function formatSDC(){
	if (!params.SDCLineHighlighted){
		resizeSDCBoxes();

		var SDCcolumnYLocations = {};
		params.options.forEach(function(d){
			if (d != 'Select Category') SDCcolumnYLocations[d] = params.SDCBoxMargin;
		})

		var using = params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
		if (using){
			for (var i=0; i<params.selectionWords.length; i++){
				var d = params.cleanString(params.selectionWords[i]);
				if (using.hasOwnProperty(d)){
					var x = params.SDCColumnCenters[using[d]] - params.SDCBoxWidth/2.;
					var y = SDCcolumnYLocations[using[d]];
					var box = d3.select('#SDCBox_'+params.cleanString(params.selectionWords[i]))
						.attr('class','SDCrectContainer ' + using[d])
						.attr('x',x)
						.attr('y',y)
						.attr('transform', 'translate(' + x + ',' + y + ')')
						.on('mousedown', startSDCLine);

					box.select('rect')
						.attr('class',using[d]+'Word ' + using[d] + ' SDCrect SDCrectDone')
						.style('fill','');

					var text = box.select('text');
					var bbox = text.node().getBBox();
					SDCcolumnYLocations[using[d]] += bbox.height+10 + params.SDCBoxMargin;// - boxHeight;
				}
			}

			//now shift each column vertically so they are centered
			var maxH = 0;
			params.options.forEach(function(d,i){
				//get the max height
				if (SDCcolumnYLocations.hasOwnProperty(d)){
					if (d != 'Select Category') {
						if (SDCcolumnYLocations[d] > maxH) maxH = SDCcolumnYLocations[d];
					}
					//now shift as needed
					if (i == params.options.length-1){
						params.options.forEach(function(dd,j){
							if (dd != 'Select Category' && SDCcolumnYLocations.hasOwnProperty(dd)) {
								if (SDCcolumnYLocations[dd] < maxH){
									var offset = (maxH - SDCcolumnYLocations[dd])/2.;
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
				}
			})


			//resize height if everything is done
			var sAll = d3.selectAll('.SDCrect').size();
			var sDone = d3.selectAll('.SDCrectDone').size();
			if (sAll == sDone){
				params.SDCSVGHeight = maxH;
				d3.select('#SDCPlotSVG').style('height',params.SDCSVGHeight + params.SDCSVGMargin.top + params.SDCSVGMargin.bottom)
				d3.select('#SDCmouseEvents').attr('height',params.SDCSVGHeight)
			}

			useSDCURLdata();
		}
	}

}
function resizeSDCBoxes(){
	for (var i=0; i<params.selectionWords.length; i++){

		var box = d3.select('#SDCBox_'+params.cleanString(params.selectionWords[i]));
		var text = box.select('text');
		text.call(wrapSVGtext, params.SDCBoxWidth-10, text.attr('orgText'));

		//fix any subcripts
		text.selectAll('tspan').each(function(){
			var t = d3.select(this).text()
			d3.select(this).html(t.replaceAll('_','<tspan dy=5>').replaceAll('$','</tspan><tspan dy=-5>'));  //I'm not closing the last tspan, but it seems OK 
		})

		//get the text height and resize the box
		var bbox = text.node().getBBox();
		box.select('rect').attr('height',bbox.height+10)
	}
}

function createSDCLine(elem,x1,y1,x2,y2,r,cat,startWords,endWords, opacity=1){
	params.SDCLineIndex += 1;

	params.SDCLine = params.SDCSVG.append('line')
		.attr('attached','false') //custom attribute to track if the line is connected
		.attr('startCategory',cat) //custom attribute to track the starting category
		.attr('endCategory','null') //custom attribute to track the ending category
		.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
		.attr('endSelectionWords',endWords) //custom attribute to track the ending word(s)			
		.attr('id','SDCLine_'+params.SDCLineIndex)
		.attr('class','SDCLine SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('stroke',params.colorMap(1))
		.attr('stroke-width',4)
		.attr('x1', x1)
		.attr('y1', y1)
		.attr('x2', x2)
		.attr('y2', y2)
		.style('stroke-opacity',opacity)
		.on('mousedown', moveExistingSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle0 = params.SDCSVG.append('circle')
		.attr('id','SDCCircle0_'+params.SDCLineIndex)
		.attr('class','SDCCircle0 SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', params.colorMap(1))
		.attr('cx',x1)
		.attr('cy',y1)
		.attr('r',r)
		.style('opacity',opacity)
		.on('mousedown', startSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle = params.SDCSVG.append('circle')
		.attr('id','SDCCircle_'+params.SDCLineIndex)
		.attr('class','SDCCircle SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', params.colorMap(1))
		.attr('cx',x2)
		.attr('cy',y2)
		.attr('r',r)
		.style('opacity',opacity)
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

	if (params.showSDCResponses){

		elem = d3.select(elem);
		if (elem){
			if (elem.select('rect')){
				var x = parseFloat(elem.attr('x')) + params.SDCBoxWidth;
				var y = parseFloat(elem.attr('y')) + parseFloat(elem.select('rect').attr('height'))/2.;

				//get the category from the rect class list (will this always be the last class value?)
				var cat = elem.node().classList[1]
				var words = elem.attr('selectionWords')
				var i = params.options.indexOf(cat);
				if (i < params.options.length-1 && !isNaN(x) && !isNaN(y)) createSDCLine(elem, x,y,x,y,6,cat,words,'null');	
			}
		}

	}

}

function moveSDCLine() {
	//stop text highlighting
	window.event.cancelBubble = true;
	window.event.returnValue = false;

	//for highlighting
	if (params.SDCLine){
		var id = 'SDCBox_'+params.SDCLine.attr('startSelectionWords')
		highlightSDCLines(d3.select('#'+id).node());
	} 

	if (params.SDCLine && params.showSDCResponses){

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
				
				var endWords = parent.attr('selectionWords')

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
						.attr('endSelectionWords',endWords);
					params.SDCLine.classed('SDCLine_null', false);
					params.SDCLine.classed('SDCLine_'+endWords, true);
					params.SDCCircle.classed('SDCLine_null', false);
					params.SDCCircle.classed('SDCLine_'+endWords, true);
					params.SDCCircle0.classed('SDCLine_null', false);
					params.SDCCircle0.classed('SDCLine_'+endWords, true);
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
	if (params.showSDCResponses){
		var useIndex = this.id.split('_')[1];
		params.SDCLine = d3.select('#SDCLine_'+useIndex);
		params.SDCCircle = d3.select('#SDCCircle_'+useIndex);
		params.SDCCircle0 = d3.select('#SDCCircle0_'+useIndex);
	}
}

function endSDCLine() {
	if (params.showSDCResponses){

		//restart text highlighting
		window.event.cancelBubble = false;
		window.event.returnValue = true;
		
		if (params.SDCLine){
			var word1 = 'SDC'+params.SDCLine.attr('startSelectionWords');
			var word2 = '';
			if (params.SDCLine.attr('attached') == 'true'){
				word2 = params.SDCLine.attr('endSelectionWords');
				//check to make sure that this line doesn't already exist
				var check = d3.selectAll('.SDCLine.SDCLine_'+word1.substring(3,word1.length)+'.SDCLine_'+word2);
				if (check.size() <= 1){
					//add to URL
					if (params.URLInputValues.hasOwnProperty(word1)){
						word2 = params.URLInputValues[word1];
						if (!params.URLInputValues[word1].includes(params.SDCLine.attr('endSelectionWords'))) word2 += '%20'+params.SDCLine.attr('endSelectionWords');
					} 
					params.URLInputValues[word1] = word2;
					appendURLdata();
				} else {
					console.log('!! duplicate line', check.size(), word1, word2);
					params.SDCLine.remove();
					params.SDCCircle.remove();
					params.SDCCircle0.remove();
					//do I need to reset these?
				}
			} else {
				var words = params.SDCLine.attr('class').replaceAll('SDCLine_','').replaceAll('SDCLine ','').split(' ');
				var toRemove = '';
				words.forEach(function(w){
					if (w != 'SDC'+word1) toRemove = w; //there should only be two in here
				})

				//delete line if not attached
				params.SDCLine.remove();
				params.SDCCircle0.remove();
				params.SDCCircle.remove();
				//remove from the URLdata
				if (params.URLInputValues.hasOwnProperty(word1)){
					console.log('!!!!!!!!!!!! removing from URL', word1, word2, toRemove)
					word2 = params.URLInputValues[word1].replace(toRemove,'').replace('%20%20','%20');
					if (word2.substring(word2.length - 3) == '%20') word2 = word2.substring(0, word2.length - 3);
					params.URLInputValues[word1] = word2;
					if (word2 == '') delete params.URLInputValues[word1]
				}
				appendURLdata();

			}

			//add to the answers if in editor
			if (params.haveParaEditor){
				params.answers.forEach(function(a){
					if (a.groupname == params.groupname && a.task == 'SDC') {
						var key = word1;
						if (word1.substring(0,3) == 'SDC') key = word1.substring(3, word1.length);
						words = word2.replaceAll('%20',' ').split(' ');
						a[key] = words;
					}
				})
			}
		}

		params.SDCLine = null;
		params.SDCCircle0 = null;
		params.SDCCircle = null;

		resetSDCLines();
	}

}

function highlightSDCLines(elem){
	if (!params.SDCLineHighlighted){
		params.SDCLineHighlighted = true;
		// d3.selectAll('.SDCLine').interrupt().transition()
		// d3.selectAll('.SDCCircle').interrupt().transition()
		// d3.selectAll('.SDCCircle0').interrupt().transition()

		var foo = d3.select(elem).attr('id')
		if (foo){
			var id = foo.substr(7,foo.length-7);

			d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionSDCDuration).style('opacity',0.1);
			d3.selectAll('.SDCAggregateLine_'+id).interrupt().transition()
			d3.selectAll('.SDCAggregateLine_'+id).style('opacity',0.5)

			d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').interrupt().transition()
			d3.selectAll('.SDCAggregateFracBox_'+id).select('text').interrupt().transition()
			d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').transition().duration(params.transitionSDCDuration).style('opacity',0.5)
			d3.selectAll('.SDCAggregateFracBox_'+id).select('text').transition().duration(params.transitionSDCDuration).style('opacity',1)


			if (params.showSDCResponses){
				d3.selectAll('.SDCLine').transition().duration(params.transitionSDCDuration).style('opacity',0.1)
				d3.selectAll('.SDCCircle').transition().duration(params.transitionSDCDuration).style('opacity',0.1)
				d3.selectAll('.SDCCircle0').transition().duration(params.transitionSDCDuration).style('opacity',0.1)
				d3.selectAll('.SDCLine_'+id).interrupt().transition()
				d3.selectAll('.SDCLine_'+id).style('opacity',1)
			}

			if (params.showSDCAnswers){
				d3.selectAll('.SDCAnswerLine').transition().duration(params.transitionSDCDuration).style('opacity',0.1);
				d3.selectAll('.SDCAnswerLine_'+id).interrupt().transition()
				d3.selectAll('.SDCAnswerLine_'+id).style('opacity',1)
			}
		}

	}

}
function resetSDCLines(){
	params.SDCLineHighlighted = false;

	if (params.showSDCResponses){
		d3.selectAll('.SDCLine').transition().duration(params.transitionSDCDuration).style('opacity',1);
		d3.selectAll('.SDCCircle').transition().duration(params.transitionSDCDuration).style('opacity',1);
		d3.selectAll('.SDCCircle0').transition().duration(params.transitionSDCDuration).style('opacity',1);
	}

	d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionSDCDuration).style('opacity',0.5);

	d3.selectAll('.SDCAggregateFracBox').select('rect').transition().duration(params.transitionSDCDuration).style('opacity',0)
	d3.selectAll('.SDCAggregateFracBox').select('text').transition().duration(params.transitionSDCDuration).style('opacity',0)

	if (params.showSDCAnswers) d3.selectAll('.SDCAnswerLine').transition().duration(params.transitionSDCDuration).style('opacity',1);


}

function useSDCURLdata(){
	if (!params.SDCLineHighlighted) {

		var op = 0;
		if (params.showSDCResponses) op = 1;

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
				var blanks = getAllIndices(endWords,"");
				blanks.forEach(function(b){endWords.splice(b, 1)});

				endWords.forEach(function(w,i){
					var startParent = d3.select('#SDCBox_'+startWords);
					var endParent = d3.select('#SDCBox_'+w);
					if (startParent.node() && endParent.node()){
						var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth;
						var y1 = parseFloat(startParent.attr('y')) + parseFloat(startParent.select('rect').attr('height'))/2.;

						var x2 = parseFloat(endParent.attr('x'))
						var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height'))/2.;

						//get the category from the rect class list (will this always be the last class value?)
						var cat = startParent.node().classList[1]

						if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) createSDCLine(startParent.node(), x1,y1,x2,y2,6,cat,startWords,w, op);
					}
					params.SDCLine = null;
					params.SDCCircle0 = null;
					params.SDCCircle = null;
				})


			}

		})
	}
}

function plotSDCAggregateLines(){

	if (!params.SDCLineHighlighted && params.SDCAggSVG) {
		//destroy the plot (if it exists)
		var parent = params.SDCAggSVG.node();
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}

		var fracBoxSize = 20;//should this change with resize?

		var SDCdata = params.aggregatedSDCResponses[params.SDCResponseVersion];
		Object.keys(SDCdata).forEach(function(startWords, j){
			var endWords = SDCdata[startWords].uniq;

			endWords.forEach(function(w,i){

				var startParent = d3.select('#SDCBox_'+startWords);
				var endParent = d3.select('#SDCBox_'+w);
				if (startParent.node() && endParent.node()){
					var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth;
					var y1 = parseFloat(startParent.attr('y')) + parseFloat(startParent.select('rect').attr('height'))/2.;

					var x2 = parseFloat(endParent.attr('x'))
					var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height'))/2.;

					//get the category from the rect class list (will this always be the last class value?)
					var cat = startParent.node().classList[1];

					//line width is based on entries
					var frac = SDCdata[startWords].num[w]/params.aggregatedSDCResponses.nVersion[params.SDCResponseVersion];
					var width = (params.maxSDCLineWidth - params.minSDCLineWidth)*frac + params.minSDCLineWidth;

					if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

						var strokeColor = params.colorMap(frac);
						if (frac < params.pctLim) strokeColor = '#d92b9c';

						var line = params.SDCAggSVG.append('line')
							.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
							.attr('endSelectionWords',w) //custom attribute to track the ending word(s)			
							.attr('fraction',frac) //custom attribute to track the fraction		
							.attr('id','SDCAggregateLine_'+params.SDCLineIndex)
							.attr('class','SDCAggregateLine SDCAggregateLine_'+startWords+ ' SDCAggregateLine_'+w)
							.attr('stroke',strokeColor)
							.attr('stroke-width',width)
							.attr('stroke-linecap','round') 
							.attr('x1', x1)
							.attr('y1', y1)
							.attr('x2', function(){
								if (params.transitionSDCAgg) return x1;
								return x2
							})
							.attr('y2', function(){
								if (params.transitionSDCAgg) return y1;
								return y2
							})
							.style('opacity',0.5)

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
							.attr('fill',params.colorMap(1))
							.style('text-anchor', 'middle')
							.style('opacity',0)
							.text(frac.toFixed(2))

					}
				}
				if (i == endWords.length - 1 && j == Object.keys(SDCdata).length - 1) params.transitionSDCAgg = false;
			})

		})
	}

}

function plotSDCAnswerLines(){
	//lots of the same code from plotSDCAggregate (above); could clean up the code by making a more generic function

	if (!params.SDCLineHighlighted) {
		var op = 0;
		if (params.showSDCAnswers) op = 1;

		var using = params.answers.filter(function(d){return (d.task == 'SDC' && d.groupname == params.groupname);})[0];
		Object.keys(using).forEach(function(startWords, j){
			if (startWords != 'task' && startWords != 'groupname'){
				var endWords = using[startWords];
				if (endWords){
					endWords.forEach(function(w,i){
						var startParent = d3.select('#SDCBox_'+startWords);
						var endParent = d3.select('#SDCBox_'+w);
						if (startParent.node() && endParent.node()){
							var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth;
							var y1 = parseFloat(startParent.attr('y')) + parseFloat(startParent.select('rect').attr('height'))/2.;

							var x2 = parseFloat(endParent.attr('x'))
							var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height'))/2.;

							//get the category from the rect class list (will this always be the last class value?)
							var cat = startParent.node().classList[1];

							if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

								var line = params.SDCAnswersSVG.append('line')
									.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
									.attr('endSelectionWords',w) //custom attribute to track the ending word(s)			
									.attr('id','SDCAnswerLine_'+params.SDCLineIndex)
									.attr('class','SDCAnswerLine SDCAnswerLine_'+startWords+ ' SDCAnswerLine_'+w)
									.attr('stroke','black')
									.attr('stroke-width',6)
									.attr('stroke-linecap','round') 
									.attr('x1', x1)
									.attr('y1', y1)
									.attr('x2', function(){
										if (params.transitionSDCAnswers) return x1;
										return x2
									})
									.attr('y2', function(){
										if (params.transitionSDCAnswers) return y1;
										return y2
									})
									.style('stroke-opacity',op)

								line.transition().duration(params.transitionDuration)
									.attr('x2', x2)
									.attr('y2', y2)
							}
							//if (i == endWords.length - 1 && j == Object.keys(using).length - 1) params.transitionSDCAnswers = false;
						}
					})
				}
			}
			if (j == Object.keys(using).length - 1) params.transitionSDCAnswers = false; //moved here in case the inner if's are not true

		})
	}

}

function recolorSDCAnswers(){
	//this algorithm will color the answer lines if the corresponding line from the aggregate is less than the limit
	//is this the correct algorithm?  I think not.  For the bars I color if the responses are less than the limit (without checking the answers)
	console.log('recoloring the answers')
	d3.selectAll('.SDCAnswerLine').each(function(){
		var elem = d3.select(this);
		var startWords = elem.attr('startSelectionWords');
		var w = elem.attr('endSelectionWords');

		var strokeColor = 'black';
		//check for a discrepancy and plot that in pink
		var aggElem = d3.select('.SDCAggregateLine_'+startWords+'.SDCAggregateLine_'+w);
		if (!aggElem) {
			strokeColor = '#d92b9c';
		} else {
			var frac = parseFloat(aggElem.attr('fraction'));
			if (frac < params.pctLim) strokeColor = '#d92b9c';
		}
		elem.attr('stroke',strokeColor)
	})
}
function recolorSDCAgg(){
	//this algorithm will color the aggregate lines the total fraction is less than the limit (matching what is done for the bars)
	console.log('recoloring the SDC aggregate')
	d3.selectAll('.SDCAggregateLine').each(function(){
		var elem = d3.select(this);
		var frac = parseFloat(elem.attr('fraction'));

		var strokeColor = params.colorMap(frac);
		if (frac < params.pctLim) strokeColor = '#d92b9c';

		//line
		elem.attr('stroke',strokeColor);

		//text
		var s = elem.attr('startSelectionWords');
		var e = elem.attr('endSelectionWords');
		d3.select('.SDCAggregateFracBox_'+s+'.SDCAggregateFracBox_'+e).select('text').attr('fill', strokeColor);

	})
}

function toggleSDCAnswers(){
	var op = 0;
	if (params.showSDCAnswers) op = 1;
	d3.selectAll('.SDCAnswerLine').transition().duration(params.transitionDuration).style('stroke-opacity',op);
}

function toggleSDCResponses(){
	var op = 0;
	if (params.showSDCResponses) {
		op = 1;
		d3.selectAll('.SDCLine').classed('hidden',false);
		d3.selectAll('.SDCCircle0').classed('hidden',false);
		d3.selectAll('.SDCCircle').classed('hidden',false);
	}
	d3.selectAll('.SDCLine').transition().duration(params.transitionDuration)
		.style('stroke-opacity',op)
		.on('end',function(){
			if (op == 0) d3.select(this).classed('hidden', true);
		});
	d3.selectAll('.SDCCircle0').transition().duration(params.transitionDuration)
		.style('opacity',op)
		.on('end',function(){
			if (op == 0) d3.select(this).classed('hidden', true);
		});
	d3.selectAll('.SDCCircle').transition().duration(params.transitionDuration)
		.style('opacity',op)
		.on('end',function(){
			if (op == 0) d3.select(this).classed('hidden', true);
		});

}
function switchSDCVersions(){
	if (this.name == 'version'){
		params.transitionSDCAgg = true
		params.SDCResponseVersion = this.value;

		params.SDCAggSVG.selectAll('line').each(function(d,i){
			var el = d3.select(this)
			var t = el.transition().duration(params.transitionDuration)
				.attr('x1', el.attr('x2'))
				.attr('y1', el.attr('y2'))
			if (i == params.SDCAggSVG.selectAll('line').size() -1){
				t.on('end',function(){
					if (params.SDCSubmitted || params.haveSDCEditor) {
						plotSDCAggregateLines();
						setTimeout(recolorSDCAgg, params.transitionDuration);
					}
				})
			}
		})
			
	}

	if (this.name == "answers"){
		params.showSDCAnswers = this.checked;
		toggleSDCAnswers();
	}
	if (this.name == "responses"){
		params.showSDCResponses = this.checked;
		toggleSDCResponses();
	}
}

function checkSDCvisibility(){
	if (!params.haveParaEditor && !params.haveSDCEditor){
		if (params.answersGroupnames.para.includes(params.groupname) && params.paraSubmitted2){
			d3.select('#systemDesignChartSVGContainer').style('visibility','visible');
			d3.select('#SDCButton').style('visibility','visible');
			d3.select('#SDCVersionOptions').style('visibility','visible');
			resize();
		} else {
			d3.select('#systemDesignChartSVGContainer').style('visibility','hidden');
			d3.select('#SDCButton').style('visibility','hidden');
			d3.select('#SDCVersionOptions').style('visibility','hidden');
		}

		checkAnswerTogglesVisibility();
	}
}