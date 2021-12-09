params.haveSDC = true;


//version options
d3.select('#SDCVersionOptions').selectAll('input').on('change',switchSDCVersions);

//for line drawing
window.addEventListener('mousemove', function(){
	if (params.mouseDown) moveSDCLine();
});
window.addEventListener('mouseup', function(){
	endSDCLine();
	params.mouseDown = false;
});
window.addEventListener('mousedown', function(){
	params.mouseDown = true;
});

//aggregate response range sliders
//fractional aggreement
if( $('#SDCAggFracRangeSlider').length ){  
	$("#SDCAggFracRangeSlider").slider({
		range: true,
		min: 0,
		max: 1,
		step: 0.01,
		values: [ 0, 1 ],
		slide: function(event, ui) {
			params.SDCFracAggLims[0] = ui.values[0];
			params.SDCFracAggLims[1] = ui.values[1];
			$("#SDCAggFracRangeSliderMin").text(params.SDCFracAggLims[0].toFixed(2));
			$("#SDCAggFracRangeSliderMax").text(params.SDCFracAggLims[1].toFixed(2));
			limitSDCAggLines();
		}
	})
}

//date range
function initAggDateSlider(){


	//generate the histogram
	var dates = getSDCResponseDates();
	params.SDChist.container = d3.select('#SDCDateHistContainer');
	params.SDChist.data = dates.seconds;
	createHistogram(params.SDChist)

	//generate the slider
	if( $('#SDCAggDateRangeSlider').length ){  
		$("#SDCAggDateRangeSlider").slider({
			range: true,
			min: params.SDCDateAggLims[0].getTime()/1000,
			max: params.SDCDateAggLims[1].getTime()/1000,
			step: 1,
			values: [params.SDCDateAggLims[0].getTime()/1000, params.SDCDateAggLims[1].getTime()/1000],
			slide: function(event, ui) {
				params.SDCDateAggLims[0] = new Date(ui.values[0]*1000.);
				params.SDCDateAggLims[1] = new Date(ui.values[1]*1000.);
				$("#SDCAggDateRangeSliderMin").text((params.SDCDateAggLims[0]).toLocaleString());
				$("#SDCAggDateRangeSliderMax").text((params.SDCDateAggLims[1]).toLocaleString());
				updateHistogram(params.SDChist);
				aggregateSDCResults();
				updateNresponses();
			},
			// stop: function() { //equivalent to mouseup
			// 	setTimeout(function(){aggregateSDCResults(true), params.transitionDuration}) //for some reason the transition will only fire if I wait with setTimeout -- NO IDEA WHY
			// },
		})		

		$("#SDCAggDateRangeSliderMin").text((params.SDCDateAggLims[0]).toLocaleString());
		$("#SDCAggDateRangeSliderMax").text((params.SDCDateAggLims[1]).toLocaleString());
	}
}

function getSDCResponseDates(){
	//get the response dates
	var SDCresponses = params.responses.filter(function(d){return d.task == 'SDC'});
	var dates = [];
	var datesSec = [];
	SDCresponses.forEach(function(d){
		dates.push(d.date);
		datesSec.push(d.seconds);
	})
	return {'dates':dates, 'seconds':datesSec};
}

function createSystemDesignChart(){
	if (!params.SDCLineHighlighted){
		console.log('creating system design chart ...', params.answersParagraphnames);

		//get the column centers
		var n = params.options.length - 1;
		var w = (window.innerWidth - 80)/n;
		var offset = w/2;
		params.SDCColumnCenters = {};
		params.options.forEach(function(d,i){
			if (d != 'Select Category') params.SDCColumnCenters[params.cleanString(d)] = (i-1)*w + offset
		})

		params.SDCBoxWidth = 0.6*w - params.SDCBoxMargin;

		params.SDCColumnYTops = {};
		params.options.forEach(function(d){
			if (d != 'Select Category') params.SDCColumnYTops[params.cleanString(d)] = params.SDCBoxMargin; //will be reset in formatSDC()
		})

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


		//will hold the aggregate results
		params.SDCAggSVG = params.SDCSVG.append('g').attr('id','SDCAggregatedLinesContainer');

		//will hold the answers results
		params.SDCAnswersSVG = params.SDCSVG.append('g').attr('id','SDCAnswersLinesContainer');

		//will hold the aggregate fraction text
		params.SDCAggTextSVG = params.SDCSVG.append('g').attr('id','SDCAggregatedTextContainer');

		// add the column headers
		params.SDCSVG.selectAll('.text')
			.data(params.options).enter().filter(function(d){return d != 'Select Category';})
			.append('text')
				.attr('class', function(d){ return 'text SDCheader '+params.cleanString(d)+'Word'; })
				.attr('x', function(d) { return params.SDCColumnCenters[params.cleanString(d)]; })
				.attr('y', 0)
				.attr('dy', '.35em')
				.style('text-anchor', 'middle')
				.style('opacity',1)
				.text(function(d){return d})


		// It looks like I need to do this in a for loop so that I can get the proper y positions
		//I will start with the boxes in random locations and without colors, then formatSDC will define the actual locations and colors if the answers are available

		params.selectionWords.forEach(function(d){

			var x = Math.random()*(params.SDCSVGWidth - params.SDCBoxWidth);
			var y = Math.random()*(params.SDCSVGHeight - params.SDCBoxWidth) + 20;

			createSDCbox(x, y, params.SDCBoxWidth, params.SDCInitBoxHeight, d);

			//get the maximum width of the text and reformat all the boxes to that (in case there are really long words)
			var maxW = params.SDCBoxWidth;
			d3.selectAll('.SDCrectContainer').each(function(){
				var rbbox = d3.select(this).select('text').node().getBoundingClientRect();
				maxW = Math.max(maxW, rbbox.width + 6);
			})
			d3.selectAll('.SDcrect').attr('width', maxW);
			d3.selectAll('.SDCtext').selectAll('.wrappedSVGtext').attr('x', maxW/2.)

		})


		if (params.answersParagraphnames.para.includes(params.cleanString(params.paragraphname)) && (params.paraSubmitted2 || params.haveParaEditor || params.haveSDCEditor)) formatSDC();

		//the first bit in here is only call it once and with animation, from aggregateSDCResults() in reader.js
		if (((params.SDCSubmitted && !params.firstSDCplot) || params.haveSDCEditor) && !params.edittedSDC) {
			plotSDCAggregateLines();
			plotSDCAnswerLines();
		}


	}
}

function createSDCbox(x,y,w,h,text){
	var box = params.SDCSVG.append('g')
		.attr('class','SDCrectContainer')
		.attr('id','SDCBox_'+params.cleanString(text))
		.attr('selectionWords',params.cleanString(text)) //custom attribute to hold the selection words
		.attr('x',x)
		.attr('y',y)
		.attr('transform', 'translate(' + x + ',' + y + ')')

	box.append('rect')
		.attr('class','SDCrect')
		.attr('x',0)
		.attr('y', 0)
		.attr('width', w)
		.attr('height', h) //will need to update this
		.style('fill','white')

	var text = box.append('text')
		.attr('class','noSelect SDCtext')
		.attr('x', w/2.)
		.attr('y', h/2.)
		.attr('dy', '.35em')
		.attr('orgText',text)
		.style('text-anchor', 'middle')
		.style('opacity',1)
		.style('fill','black')
		.text(text)
		.call(wrapSVGtext, w - 10)

	//fix any subcripts
	text.selectAll('tspan').each(function(){
		var t = d3.select(this).text()
		d3.select(this).html(params.applySubSuperStringSVG(t));
	})

	//get the text height and resize the box
	var bbox = text.node().getBBox();
	box.select('rect').attr('height',bbox.height+10)

	return box;
}

function formatSDC(duration=0){
	if (!params.SDCLineHighlighted){
		resizeSDCBoxes();

		var SDCcolumnYLocations = {};
		params.options.forEach(function(d){
			if (d != 'Select Category') SDCcolumnYLocations[params.cleanString(d)] = params.SDCColumnYTops[params.cleanString(d)];
		})

		//build from the bottom up with the selectionWords in reverse
		var reversedSelectionWords = params.selectionWords.slice().reverse();
		var using = params.answers.filter(function(d){return (d.task == 'para' && params.cleanString(d.paragraphname) == params.cleanString(params.paragraphname));})[0];
		if (using){
			for (var i=0; i<reversedSelectionWords.length; i++){
				var d = params.cleanString(reversedSelectionWords[i]);
				if (using.hasOwnProperty(d)){
					var dd = params.cleanString(using[d]);
					var x = params.SDCColumnCenters[dd] - params.SDCBoxWidth/2.;
					var y = SDCcolumnYLocations[dd];
					if (x && y && !isNaN(x) && !isNaN(y)){
						var box = d3.select('#SDCBox_'+params.cleanString(reversedSelectionWords[i]))
							.attr('class','SDCrectContainer ' + using[d])
							.attr('x',x)
							.attr('y',y)
							.on('mousedown', startSDCLine)

						box.select('rect')
							.attr('class',dd+'Word ' + dd + ' SDCrect SDCrectDone')
							.style('fill','');

						box.transition().duration(duration)
							.attr('transform', 'translate(' + x + ',' + y + ')')

						var text = box.select('text');
						var bbox = text.node().getBBox();
						SDCcolumnYLocations[dd] += bbox.height+10 + params.SDCBoxMargin;// - boxHeight;
					}
				}
			}

			//now shift each column vertically so they are centered
			var maxH = 0;
			params.options.forEach(function(d){
				//get the max height
				if (SDCcolumnYLocations.hasOwnProperty(params.cleanString(d))){
					if (d != 'Select Category') {
						var h = SDCcolumnYLocations[params.cleanString(d)] - params.SDCColumnYTops[params.cleanString(d)];
						if (h > maxH) maxH = h;
					}
				}
			})

			//if any of the ytops end up negative, I need to shift the entire block downards
			var minY = 0.;
			Object.keys(params.SDCColumnYTops).forEach(function(d){
				minY = Math.min(minY, params.SDCColumnYTops[d]); 
			})
			if (minY < 0){
				console.log('adjusting')
				Object.keys(params.SDCColumnYTops).forEach(function(d){
					d3.selectAll('.SDCrectContainer.'+d).each(function(){
						var y = parseFloat(d3.select(this).attr('y')) - minY + params.SDCBoxMargin;
						var x = d3.select(this).attr('x')
						if (x && y){
							d3.select(this)
								.attr('x',x)
								.attr('y',y)
						}
					})
					params.SDCColumnYTops[d] -= minY;
				})
			}

			//now shift as needed
			params.options.forEach(function(d){
				var dd = params.cleanString(d);
				if (d != 'Select Category' && SDCcolumnYLocations.hasOwnProperty(dd)) {
					var h = SDCcolumnYLocations[dd] - params.SDCColumnYTops[dd];
					if (h < maxH){
						var h = SDCcolumnYLocations[dd] - params.SDCColumnYTops[dd]; 
						var offset = (maxH - h)/2.;
						params.SDCColumnYTops[dd] =  offset + params.SDCBoxMargin;
						d3.selectAll('.SDCrectContainer.'+dd).each(function(){
							var y = parseFloat(d3.select(this).attr('y')) + offset ;
							var x = d3.select(this).attr('x')
							if (x && y){
								d3.select(this)
									.attr('x',x)
									.attr('y',y)
								d3.select(this).transition().duration(duration)
									.attr('transform', 'translate(' + x + ','+ y + ')');
							}
						})
					}
				}
			})


			//resize height if everything is done
			var sAll = d3.selectAll('.SDCrect').size();
			var sDone = d3.selectAll('.SDCrectDone').size();
			if (sAll == sDone){
				params.SDCSVGHeight = maxH + 40; //to be safe
				d3.select('#SDCPlotSVG').style('height',params.SDCSVGHeight + params.SDCSVGMargin.top + params.SDCSVGMargin.bottom + params.SDCBoxMargin)
			}

			useSDCURLdata();
		}
	}

	drawProcessingArrows(duration);


}
function resizeSDCBoxes(){
	for (var i=0; i<params.selectionWords.length; i++){
		var box = d3.select('#SDCBox_'+params.cleanString(params.selectionWords[i]));
		var text = box.select('text');
		if (text.node()){
			text.call(wrapSVGtext, params.SDCBoxWidth-10, text.attr('orgText'));

			//fix any subcripts
			text.selectAll('tspan').each(function(){
				var t = d3.select(this).text()
				d3.select(this).html(params.applySubSuperStringSVG(t))
			})

			//get the text height and resize the box
			var bbox = text.node().getBBox();
			box.select('rect').attr('height',bbox.height+10);
		}
	}
}

function createSDCLine(elem,x1,y1,x2,y2,cat,startWords,endWords, opacity=1){
	params.SDCLineIndex += 1;

	params.SDCLine = params.SDCSVG.append('line')
		.attr('attached','false') //custom attribute to track if the line is connected
		.attr('startCategory',cat) //custom attribute to track the starting category
		.attr('endCategory','null') //custom attribute to track the ending category
		.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
		.attr('endSelectionWords',endWords) //custom attribute to track the ending word(s)			
		.attr('id','SDCLine_'+params.SDCLineIndex)
		.attr('class','SDCLine SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('stroke',params.SDCResponseLineColor)
		.attr('stroke-width',params.SDCResponseLineThickness)
		.attr('x1', x1 + 'px')
		.attr('y1', y1 + 'px')
		.attr('x2', x2 + 'px')
		.attr('y2', y2 + 'px')
		.style('stroke-opacity',opacity)
		.on('mousedown', moveExistingSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle0 = params.SDCSVG.append('circle')
		.attr('id','SDCCircle0_'+params.SDCLineIndex)
		.attr('class','SDCCircle0 SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', params.SDCResponseLineColor)
		.attr('cx',x1 + 'px')
		.attr('cy',y1 + 'px')
		.attr('r',(2*params.SDCResponseLineThickness) + 'px')
		.style('opacity',opacity)
		.on('mousedown', startSDCLine)
		//.on('mouseover',function(){highlightSDCLines(elem)})
		//.on('mouseout',resetSDCLines);

	params.SDCCircle = params.SDCSVG.append('circle')
		.attr('id','SDCCircle_'+params.SDCLineIndex)
		.attr('class','SDCCircle SDCLine_'+startWords+' SDCLine_'+endWords)
		.attr('fill', params.SDCResponseLineColor)
		.attr('cx',x2 + 'px')
		.attr('cy',y2 + 'px')
		.attr('r',(2*params.SDCResponseLineThickness) + 'px')
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
				var i = lowerArray(params.options).indexOf(cat);
				if (i > -1 && i < params.options.length-1 && !isNaN(x) && !isNaN(y)) createSDCLine(elem, x,y,x,y,cat,words,'null');	
			}
		}

	}

}

function moveSDCLine() {
	//make sure the mouse is within the SDC container

	var elem = document.elementFromPoint(params.event.clientX, params.event.clientY);
	var proceed = false;

	if (elem){
		while (elem) {
			if (elem.id == 'SDCPlotSVG') proceed = true;
			elem = elem.parentNode;
		}

	}

	if (proceed){
		//stop text highlighting
		window.event.cancelBubble = true;
		window.event.returnValue = false;

		//for highlighting
		if (params.SDCLine){
			var id = 'SDCBox_'+params.SDCLine.attr('startSelectionWords')
			highlightSDCLines(d3.select('#'+id).node());
		} 

		if (params.SDCLine && params.showSDCResponses){
			//fix for Firefox
			var offX  = (params.event.offsetX || params.event.pageX - d3.select('#SDCPlotSVG').node().getBoundingClientRect().left - window.scrollX);
			var offY  = (params.event.offsetY || params.event.pageY - d3.select('#SDCPlotSVG').node().getBoundingClientRect().top - window.scrollY);
			var x = offX - params.SDCSVGMargin.left;
			var y = offY - params.SDCSVGMargin.top;

			// var x = params.event.layerX - params.SDCSVGMargin.left;
			// var y = params.event.layerY - params.SDCSVGMargin.top;

			//snap to object if close enough
			elem = document.elementFromPoint(params.event.clientX + 20, params.event.clientY);
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
					var i = lowerArray(params.options).indexOf(cat);
					var i0 = lowerArray(params.options).indexOf(cat0);
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
					.attr('endSelectionWords','null')
					.attr('class','SDCLine SDCLine_'+params.SDCLine.attr('startSelectionWords'));
			}
			

			var x1 = params.SDCLine.attr('x1')
			var y1 = params.SDCLine.attr('y1')
			if (x < x1){
				x = x1;
				y = y1
			}
			params.SDCLine
				.attr('x2', x + 'px')
				.attr('y2', y + 'px');

			params.SDCCircle
				.attr('cx', x + 'px')
				.attr('cy', y + 'px');

		}
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
					if (params.cleanString(a.paragraphname) == params.cleanString(params.paragraphname) && a.task == 'SDC') {
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
			d3.selectAll('.SDCAggregateLine_'+id).style('opacity',params.SDCAggLineOpacity)

			d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').interrupt().transition()
			d3.selectAll('.SDCAggregateFracBox_'+id).select('text').interrupt().transition()
			d3.selectAll('.SDCAggregateFracBox_'+id).select('rect').transition().duration(params.transitionSDCDuration).style('opacity',1)
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

	d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionSDCDuration).style('opacity',params.SDCAggLineOpacity);

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

						if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) createSDCLine(startParent.node(), x1,y1,x2,y2,cat,startWords,w, op);
					}
					params.SDCLine = null;
					params.SDCCircle0 = null;
					params.SDCCircle = null;
				})


			}

		})
	}
}

function plotSDCAggregateLines(duration = 0){

	//var op = 0.5;
	var op = params.SDCAggLineOpacity;
	if (!params.showSDCAggregate) op = 0;

	if (!params.SDCLineHighlighted && params.SDCAggSVG) {
		//destroy the plot (if it exists)
		var parent = params.SDCAggSVG.node();
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
		parent = params.SDCAggTextSVG.node();
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
		var fracBoxSize = 20;//should this change with resize?

		var SDCdata = params.aggregatedSDCResponses[params.SDCResponseVersion];
		if (SDCdata){
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
						//var width = (params.maxSDCLineWidth - params.minSDCLineWidth)*frac + params.minSDCLineWidth;
						var width = params.SDCAggLineThickness;

						if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

							var strokeColor = params.colorMap(frac);

							var line = params.SDCAggSVG.append('line')
								.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
								.attr('endSelectionWords',w) //custom attribute to track the ending word(s)			
								.attr('fraction',frac.toFixed(2)) //custom attribute to track the fraction		
								.attr('id','SDCAggregateLine_'+params.SDCLineIndex)
								.attr('class','SDCAggregateLine SDCAggregateLine_'+startWords+ ' SDCAggregateLine_'+w)
								.attr('stroke',strokeColor)
								.attr('stroke-width',width)
								.attr('stroke-linecap','round') 
								.attr('x1', x1)
								.attr('y1', y1)
								.attr('x2', function(){
									if (duration > 0) return x1;
									return x2
								})
								.attr('y2', function(){
									if (duration > 0) return y1;
									return y2
								})
								.style('opacity',1)
								.style('stroke-opacity',op)

							line.transition().duration(duration)
								.attr('x2', x2)
								.attr('y2', y2)

							//also create a box and text to hold the fraction
							var textHolder = params.SDCAggTextSVG.append('g')
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
								.attr('dy', '.1em')
								.attr('transform','rotate(' + angle + ',' + xt + ',' + yt + ')')
								//.attr('fill',params.colorMap(frac))
								.attr('fill','black')
								.attr('fraction',frac.toFixed(2))
								.style('text-anchor', 'middle')
								.style('opacity',0)
								.text(frac.toFixed(2))

						}
					}
					if (i == endWords.length - 1 && j == Object.keys(SDCdata).length - 1) params.transitionSDCAgg = false;
				})

			})
			limitSDCAggLines();
		}
	}

}

function plotSDCAnswerLines(duration = 0){
	//lots of the same code from plotSDCAggregate (above); could clean up the code by making a more generic function

	if (!params.SDCLineHighlighted) {
		var op = 0;
		if (params.showSDCAnswers) op = 1;

		//remove the answer lines if they exist
		d3.selectAll('.SDCAnswerLine').remove();

		var using = params.answers.filter(function(d){return (d.task == 'SDC' && params.cleanString(d.paragraphname) == params.cleanString(params.paragraphname));})[0];
		if (using){
			Object.keys(using).forEach(function(startWords, j){
				if (startWords != 'task' && startWords != 'paragraphname'){
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
										.attr('stroke',params.SDCAanswerLineColor)
										.attr('stroke-width',params.SDCAanswerLineThickness)
										.attr('stroke-linecap','round') 
										.attr('x1', x1)
										.attr('y1', y1)
										.attr('x2', function(){
											if (duration > 0) return x1;
											return x2
										})
										.attr('y2', function(){
											if (duration > 0) return y1;
											return y2
										})
										.style('stroke-opacity',op)

									line.transition().duration(duration)
										.attr('x2', x2)
										.attr('y2', y2)
								}
								//if (i == endWords.length - 1 && j == Object.keys(using).length - 1) params.transitionSDCAnswers = false;
							}
						})
					}
				}

			})
		}
	}

}

function recolorSDCAnswers(){
	//this algorithm will color the answer lines (currently not used)
	console.log('recoloring the answers')
	d3.selectAll('.SDCAnswerLine').each(function(){
		var elem = d3.select(this);
		var startWords = elem.attr('startSelectionWords');
		var w = elem.attr('endSelectionWords');

		var strokeColor = params.SDCAanswerLineColor;
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
	//this algorithm will color the aggregate lines 
	console.log('recoloring the SDC aggregate')
	d3.selectAll('.SDCAggregateLine').each(function(){
		var elem = d3.select(this);
		var frac = parseFloat(elem.attr('fraction'));

		var strokeColor = params.colorMap(frac);
		//if (frac < params.pctLim) strokeColor = '#d92b9c';

		//line
		elem.attr('stroke',strokeColor);

		//text
		// var s = elem.attr('startSelectionWords');
		// var e = elem.attr('endSelectionWords');
		// d3.select('.SDCAggregateFracBox_'+s+'.SDCAggregateFracBox_'+e).select('text').attr('fill', strokeColor);

	})
}

function toggleSDCAnswers(){
	var op = 0;
	if (params.showSDCAnswers) op = 1;
	d3.selectAll('.SDCAnswerLine').transition().duration(params.transitionDuration).style('stroke-opacity',op);
}

function toggleSDCAggregate(){
	var op = 0;
	var vis = 'hidden';
	if (params.showSDCAggregate) {
		op = params.SDCAggLineOpacity;
		vis = 'visible';
	}
	d3.selectAll('.SDCAggregateLine').transition().duration(params.transitionDuration).style('stroke-opacity',op);
	d3.selectAll('.SDCAggregateFracBox').transition().duration(params.transitionDuration).style('visibility',vis);

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


function replotSDCAggregateLines(dur, replot=true){
	console.log('replotting SDC AggregateLines', dur)
	params.SDCAggSVG.selectAll('line').each(function(d,i){
		var el = d3.select(this);
		var t = el.transition().duration(dur)
			.attr('x1', el.attr('x2'))
			.attr('y1', el.attr('y2'))
		if (replot && i == params.SDCAggSVG.selectAll('line').size() -1){
			t.on('end',function(){
				if (params.SDCSubmitted || params.haveSDCEditor) {
					plotSDCAggregateLines(dur);
					setTimeout(recolorSDCAgg, dur);
				}
			})
		}
	})
	updateNresponses();
}

function switchSDCVersions(){
	if (this.name == 'version'){
		params.SDCResponseVersion = this.value;
		replotSDCAggregateLines(params.transitionDuration);
	}

	if (this.name == "answers"){
		params.showSDCAnswers = this.checked;
		toggleSDCAnswers();
	}
	if (this.name == "responses"){
		params.showSDCResponses = this.checked;
		toggleSDCResponses();
	}

	if (this.name == "aggregate"){
		params.showSDCAggregate = this.checked;
		toggleSDCAggregate();
	}
}

function checkSDCvisibility(){
	if (!params.haveParaEditor && !params.haveSDCEditor){
		if (params.answersParagraphnames.para.includes(params.cleanString(params.paragraphname)) && params.paraSubmitted2){
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

function drawProcessingArrows(duration = 0){


	//remove the answer lines if they exist
	d3.select('#SDCArrowsContainer').remove();

	d3.select('#SDCPlotContainer').append('g').attr('id', 'SDCArrowsContainer');

	//add the arrowhead marker
	d3.select('#SDCArrowsContainer').append('svg:defs').append('svg:marker')
		.attr('id', 'triangle')
		.attr('viewBox','0 -5 10 10')
		.attr('refX', 0)
		.attr('refY', 0)
		.attr('markerWidth', 3)
		.attr('markerHeight', 3)
		.attr('orient', 'auto')
		.append('path')
			.attr('d', 'M0,-5L10,0L0,5')
			.style('fill', 'black');

	//get all the elements and sort them from bottom to top
	var elems = [];
	d3.selectAll('.SDCrectContainer.processing').each(function(elem){
		elems.push(this);
	});
	if (elems.length > 0){
		//reverse sort by y location
		elems.sort(function(a, b){  
			return d3.select(b).attr('y') - d3.select(a).attr('y');
		});
		elems.forEach(function(elem, i){
			if (i+1 < elems.length){
				var startParent = d3.select(elem);
				var endParent = d3.select(elems[i+1]);
				if (startParent.node() && endParent.node()){
					var x1 = parseFloat(startParent.attr('x')) + params.SDCBoxWidth/2.;
					var y1 = parseFloat(startParent.attr('y'));

					var x2 = parseFloat(endParent.attr('x')) + params.SDCBoxWidth/2.;
					var y2 = parseFloat(endParent.attr('y')) + parseFloat(endParent.select('rect').attr('height')) + 10; //for the arrow head

					startWords = startParent.attr('selectionWords');
					endWords = endParent.attr('selectionWords');
					//get the category from the rect class list (will this always be the last class value?)
					var cat = startParent.node().classList[1];

					if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {

						var line = d3.select('#SDCArrowsContainer').append('line')
							.attr('startSelectionWords',startWords) //custom attribute to track the starting word(s)
							.attr('endSelectionWords',endWords) //custom attribute to track the ending word(s)			
							.attr('id','SDCArrowLine_'+i)
							.attr('class','SDCArrowLine SDCArrowLine_'+startWords+ ' SDCArrowLine_'+endWords)
							.attr('stroke','#000000')
							.attr('stroke-width',3)
							.attr('stroke-linecap','flat') 
							.attr('x1', x1)
							.attr('y1', y1)
							.attr('marker-end', 'url(#triangle)')
							.attr('x2', function(){
								if (duration > 0) return x1;
								return x2
							})
							.attr('y2', function(){
								if (duration > 0) return y1;
								return y2
							})
							.style('stroke-opacity',1)

						line.transition().duration(duration)
							.attr('x2', x2)
							.attr('y2', y2)
					}
				}
			}
		})
	}


}

function limitSDCAggLines(){
	//hide any aggregate lines and text values that are outside of the limits
	//and show those that are within the limits
	params.SDCAggSVG.selectAll('line').each(function(){
		var elem = d3.select(this);
		var frac = parseFloat(elem.attr('fraction'));
		if (frac >= params.SDCFracAggLims[0] && frac <= params.SDCFracAggLims[1]){
			elem.style('visibility','visible')
		} else {
			elem.style('visibility','hidden')
		}
	})
	params.SDCAggTextSVG.selectAll('text').each(function(){
		var elem = d3.select(this);
		var frac = parseFloat(elem.attr('fraction'));
		if (frac >= params.SDCFracAggLims[0] && frac <= params.SDCFracAggLims[1]){
			elem.style('visibility','visible')
		} else {
			elem.style('visibility','hidden')
		}
	})

	d3.selectAll()

}