//this function will use the answers to create a grid of boxes and highlight the correct values


params.haveBars = true;

//version options
d3.select('#paraVersionOptions').selectAll('input').on('change',switchParaVersions);

//date range
function initParaAggDateUI(dur){

	//generate the histogram
	var dates = getParaResponseDates();
	params.paraHist.data = dates.milliseconds;
	if (params.paraHist.container == null){
		setParaResponseDateRange();
		params.paraHist.parent = d3.select('#boxGrid');
		params.paraHist.container = d3.select('#paraDateHistContainer');
		params.paraHist.brushCallback = function(){
			aggregateParaResults(true);
		}
		params.paraHist.resetCallback = function(){
			setParaResponseDateRange();
			aggregateParaResults(true);	
		}		
		createHistogram(params.paraHist);
	} else {
		updateHistogram(params.paraHist, dur)
	}

}

function getParaResponseDates(){
	//get the response dates
	var paraResponses = params.responses.filter(function(d){return d.task == 'para';})
	if (params.paraResponseVersion > 0) paraResponses = paraResponses.filter(function(d){ return d.version == params.paraResponseVersion;});
	var dates = [];
	var milliseconds = [];
	paraResponses.forEach(function(d){
		dates.push(d.date);
		milliseconds.push(d.date.getTime());
	})
	return {'dates':dates, 'milliseconds':milliseconds};
}
function setParaResponseDateRange(){
	var dates = getParaResponseDates();
	if (dates.dates.length >= 2){
		//sort the dates (may not be necessary)
		dates.dates.sort(function(a, b){  
			return dates.milliseconds.indexOf(a.getTime()) - dates.milliseconds.indexOf(b.getTime());
		});
		params.paraHist.dateAggLims[0] = dates.dates[0];
		params.paraHist.dateAggLims[1] = dates.dates[dates.dates.length - 1];
	} else {
		params.paraHist.dateAggLims[0] = new Date();
		params.paraHist.dateAggLims[1] = new Date();
	}
}

function createBars(){
	params.createdBars = false;
	//destroy the plot (if it exists)
	var parent = d3.select('#boxGridSVGContainer').node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	// if (params.wavingBars){
	// 	clearInterval(params.waveInterval);
	// 	params.waveTimeouts.forEach(function(w){ clearTimeout(w); });
	// 	params.wavingBars = false;
	// }

	var bbI = d3.select('#boxGridInstructions').node().getBoundingClientRect();
	var bbV = d3.select('#paraVersionOptions').node().getBoundingClientRect();
	var fsp = Math.min(Math.max(0.01*window.innerWidth, params.paraFSmin), params.maxPlotFont);

	//check whether we are plotting this in side-by-side w/ paragraph or top-bottom
	var offset = fsp;
	var plotSSWidth = window.innerWidth*params.plotFraction;
	params.barHeight = 1.5*fsp + offset;
	var totalWidth;
	//console.log('check widths', window.innerWidth, plotSSWidth, window.innerWidth - plotSSWidth, params.minPlotWidth, params.minParaWidth)
	if (plotSSWidth >= params.minPlotWidth && (window.innerWidth - plotSSWidth >= params.minParaWidth) ){
		//side-by-side view
		console.log('plot side-by-side view')
		totalWidth = plotSSWidth;
	} else {
		//top-bottom view
		console.log('plot top-bottom view')
		totalWidth = window.innerWidth -100;
	}

	//final check on total height (because this sets the bar height, which isn't changed on resize)
	//maybe I should just reset the barHeight to be fsp + offset?

	//It would be better to determine these margins based on the plot size and font size!  I will resize this later after the text is added
	params.boxGridSVGMargin = {"top":20,"bottom":100,"left":0.7*totalWidth,"right":20};
	params.boxGridSVGHeight = params.selectionWords.length*params.barHeight;
	params.boxGridSVGHistHeight = params.barHeight - offset;
	//make the bars squares, factor of 1.3 just judged by eye to make approximately square
	params.boxGridSVGWidth = Math.min((params.boxGridSVGHistHeight*1.3)*(params.options.length - 1), 0.5*window.innerWidth); //one option is 'Select Category'
	//params.boxGridSVGWidth = totalWidth - params.boxGridSVGMargin.left - params.boxGridSVGMargin.right;
	console.log('check widths', window.innerWidth, plotSSWidth, window.innerWidth - plotSSWidth, params.minPlotWidth, params.minParaWidth, params.boxGridSVGHistHeight, params.boxGridSVGWidth, params.boxGridSVGHeight)

	
	params.boxGridSVG = d3.select('#boxGridSVGContainer').append('svg')
		.style('height',params.boxGridSVGHeight + params.boxGridSVGMargin.top + params.boxGridSVGMargin.bottom)
		.style('width',params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right)
		.append("g")
			.attr("id","boxGridPlotContainer")
			.attr("transform", "translate(" + params.boxGridSVGMargin.left + "," + params.boxGridSVGMargin.top + ")");


	//set the instructions bounding box
	var boxGridWidth = 	Math.max(params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right, params.minPlotWidth);
	d3.select('#boxGrid').style('width', boxGridWidth + 'px');

	params.barOpacity = 0.2;

	//create the grid of histograms (using svg rects)
	params.selectionWords.forEach(function(c,j){

		//set up dummy data so that I can define the visualization ahead of time 
		//this may be a bit of a waste of memory, but I can't think of a better way to enable the waving feature that I want :) <-- note that I'm not using the waving feature anymore.  Should I remove this??
		params.dummyData[params.cleanString(c)] = [];
		params.options.forEach(function(o, i){
			if (o != 'Select Category'){
				//var v = (j/params.selectionWords.length + i/params.options.length) % 1;
				var dat = {"category":params.cleanString(o), "value":0}
				params.dummyData[params.cleanString(c)].push(dat);
			}
		});

		var thisPlot = params.boxGridSVG.append('g')
			.attr('id',params.cleanString(c)+'_bar')
			.attr("transform", "translate(0," + params.barHeight*j + ")")

		// set the ranges
		params.boxGridxScale = d3.scaleBand()
			.range([0, params.boxGridSVGWidth])
			.padding(0.1)
			.domain(params.dummyData[params.cleanString(c)].map(function(d) { return d.category; }));
		params.boxGridyScale = d3.scaleLinear()
			.range([params.boxGridSVGHistHeight, 0])
			.domain([0,1]);

		//add the histograms
		thisPlot.selectAll(".bar")
			.data(params.dummyData[params.cleanString(c)]).enter().append("rect")
				.attr("class",function(d){ return "bar " + d.category;})
				.attr("x", function(d) { return params.boxGridxScale(d.category); })
				.attr("width", params.boxGridxScale.bandwidth())
				.attr("y", function(d) { return params.boxGridyScale(d.value); })
				.attr("height", function(d) { return params.boxGridSVGHistHeight - params.boxGridyScale(d.value); })
				//.style("fill","#274d7e")
				.style("fill",function(d){return params.colorMap(d.value);})
				.style("opacity", params.barOpacity)

		// add blank rects for hovering; these will also be used to show the answers (currently hovering is not needed)
		thisPlot.selectAll(".barHover")
			.data(params.dummyData[params.cleanString(c)]).enter().append("rect")
				.attr("class",function(d){ return "barHover " + d.category;})
				.attr("x", function(d) { return params.boxGridxScale(d.category); })
				.attr("width", params.boxGridxScale.bandwidth())
				.attr("y", params.boxGridyScale(1))
				.attr("height", params.boxGridSVGHistHeight - params.boxGridyScale(1))
				.style("fill","white")
				.style("fill-opacity",0)
				.style("stroke", "none")
				.style("stroke-opacity",0)
				// .on("mouseover",handleBarMouseOver)
				// .on("mouseout",handleBarMouseOut);

		//add text holder
		thisPlot.selectAll('.text')
			.data(params.dummyData[params.cleanString(c)]).enter().append('text')
				.attr('class', function(d){ return 'text '+d.category; })
				.attr("x", function(d) { return params.boxGridxScale(d.category) + params.boxGridxScale.bandwidth()/2.; })
				.attr("y", params.boxGridyScale(0.4))
				.style('font-size', Math.min(0.5*params.boxGridyScale(0), fsp))
				.style("text-anchor", "middle")
				.style('opacity',0)


		// add the x Axis
		if (j == params.selectionWords.length-1) {
			thisPlot.append("g")
				.attr("transform", "translate(0," + params.boxGridSVGHistHeight + ")")
				.call(d3.axisBottom(params.boxGridxScale))
				.selectAll("text")
					.attr("y", 0)
					.attr("x", -9)
					.attr("dy", ".35em")
					.attr("transform", "rotate(-90)")
					.style("text-anchor", "end")
					.style("font-size",fsp)
					.attr('class',function(d){return params.cleanString(d)+'Word' + ' columnLabel'})

		}else{
			thisPlot.append("g")
				.attr("transform", "translate(0," + params.boxGridSVGHistHeight + ")")
				.call(d3.axisBottom(params.boxGridxScale).tickValues([]).tickSize(0));
		}

		// // add the y Axis
		// thisPlot.append("g")
		// 	.call(d3.axisLeft(params.boxGridyScale).tickValues([]).tickSize(0));

		fsp = resizeBarPlot();

		//add the labels for the y axis
		thisPlot.append("text")
			.attr('class','rowLabel')
			.attr('orgText',c)
			.attr("x","-5px")
			.attr("y",params.boxGridSVGHistHeight)
			//.attr("dy", "-1em")
			.style("text-anchor", "end")
			.style("font-size",fsp)
			.html(params.applySubSuperStringSVG(c))


	});


	params.createdBars = true;

	//show the bars
	console.log("showing results", params.showingResults)
	if (params.showingResults){
		defineBars();
	} else {
//		if (!params.wavingBars)setWaveBars();
	}

	resize();
}

function resizeBarPlot(){
	//resize the margins and plot as necessary, given the labels
	resizeBarContainer();
	var fsp = Math.min(Math.max(0.01*window.innerWidth, params.paraFSmin), params.maxPlotFont);
	var offset = fsp;
	params.barHeight = 1.5*fsp + offset;

	//check the width to see if it's larger than the window width (and shrink font if necessary)
	var plotWidth = params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right;
	if (plotWidth > window.innerWidth){
		//not obvious how to define this
		var fsfac = 1.  - 2.0*(plotWidth - window.innerWidth)/plotWidth;
		console.log("shrinking font size", fsfac, plotWidth, window.innerWidth)
		fsp *= fsfac;
		fsp = Math.max(params.minPlotFont, fsp);
		d3.selectAll('.rowLabel').style('font-size', fsp)
		d3.selectAll('.columnLabel').style('font-size', fsp)
	}

	resizeBarContainer();

	return fsp

}
function resizeBarContainer(){
	//resize the margins and plot as necessary, given the labels
	var maxW = 0;
	d3.selectAll('.rowLabel').each(function(d){
		if (this.getBoundingClientRect().width > maxW) maxW = this.getBoundingClientRect().width;
	})
	var maxH = 0;
	d3.selectAll('.columnLabel').each(function(d,i){
		if (this.getBoundingClientRect().height > maxH) maxH = this.getBoundingClientRect().height;
	})

	params.boxGridSVGMargin.left = maxW + 10;
	params.boxGridSVGMargin.bottom = maxH + 10;
	d3.select('#boxGridSVGContainer').select('svg')
		.style('height',params.boxGridSVGHeight + params.boxGridSVGMargin.top + params.boxGridSVGMargin.bottom)
		.style('width',params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right)
	params.boxGridSVG.attr("transform", "translate(" + params.boxGridSVGMargin.left + "," + params.boxGridSVGMargin.top + ")");
}


function updateBars(thisPlot, data, duration, easing, op){
	//update the data in a bar chart
	var update = thisPlot.selectAll('.bar').data(data)
		.attr("x", function(d) { return params.boxGridxScale(d.category); })
		.attr('data-pct',function(d) { return d.value;})

	var trans = update.transition().ease(easing).duration(duration)
		.attr("y", function(d) { return params.boxGridyScale(d.value); })
		.attr("height", function(d) { return params.boxGridSVGHistHeight - params.boxGridyScale(d.value); })
		.style("fill",function(d){return params.colorMap(d.value);})
		.style("opacity", op)

	return trans;

}

function defineBars(){
	params.barOpacity = 1.;

	// clearInterval(params.waveInterval);
	// params.waveTimeouts.forEach(function(w){ clearTimeout(w); });

	//clean up the row labels
	d3.selectAll('.rowLabel').each(function(){
		var txt = d3.select(this).text().replaceAll('*','');
		d3.select(this)
			.style('font-style', 'normal')
			.style('fill','black')
			.text(txt)
	})

	//clean up the selectionWord outlines
	d3.selectAll('.selectionWord').classed('wrongBorder',false)

	//show the real aggregated data from the users
	params.selectionWords.forEach(function(c,j){
		var thisPlot = d3.select('#'+params.cleanString(c)+'_bar');

		//set up real data 
		var realData = []
		params.options.forEach(function(o){
			if (o != 'Select Category'){
				var agg = params.aggregatedParaResponses[params.paraResponseVersion][params.cleanString(c)]
				var v = 0;
				if (agg) v = agg.num[params.cleanString(o)]/agg.total || 0;
				var dat = {"category":params.cleanString(o), "value":v}
				realData.push(dat);
			}
		});
		if (j == 0) console.log('realData',realData)
		var update = updateBars(thisPlot, realData, params.transitionDuration, d3.easeLinear, params.barOpacity);

		//add text
		thisPlot.selectAll('.text').transition().duration(params.transitionDuration/2.)
			.style('opacity',function(){
				if (params.toggleParaText){
					return 0;
				}
				return 1;})
			.on('end',function(){
				thisPlot.selectAll('.text').data(realData).text(function(d){return parseFloat(d.value).toFixed(2);})
				thisPlot.selectAll('.text').transition().duration(params.transitionDuration/2.).style('opacity',1)
				params.toggleParaText = false;
			})

		//recolor based on aggregate responses
		//instead of comparing to answers, check for discrepancies within the submitted answers and note this
		var maxPct = 0;
		thisPlot.selectAll('.bar').each(function(d){
			if (d.value > maxPct) maxPct = d.value;
		})
		if (maxPct < params.pctLim){
			//change color on the visualization
			var elem = d3.select('#'+params.cleanString(c)+'_bar').select('.rowLabel')
			var txt = params.applySubSuperStringSVG(elem.attr('orgText').replaceAll('*',''));
			elem.html('**'+txt+'**')
				.style('font-style', 'italic')
				.style('fill','#d92b9c');

			//change color in the paragraph
			var elem2 = d3.select('#'+params.cleanString(c)).node().parentNode;
			d3.select(elem2).classed('wrongBorder',true);
		}

		if (j == params.selectionWords.length - 1){
			update.on("end", function(){params.showingResults = true})
			showParaAnswers();

			// //check for discrepancies from the provided answers and note this
			// params.answers.columns.forEach(function(k){
			// 	var pct = d3.select('#'+k+'_bar').select('.bar.'+params.answers[0][k]).attr('data-pct')
			// 	if (pct < params.pctLim){
			// 		//change color on the visualization
			// 		var elem = d3.select('#'+params.cleanString(k)+'_bar').select('.rowLabel')
			// 		var txt = elem.text().replaceAll('*','');
			// 		elem.text('**'+txt+'**')
			// 			.style('font-style', 'italic')
			// 			.style('fill','#d92b9c');

			// 		//change color in the paragraph
			// 		var elem2 = d3.select('#'+params.cleanString(k)).node().parentNode;
			// 		d3.select(elem2).classed('wrongBorder',true);
			// 	}
			// })



		}

	});
	resizeBarContainer();


}

function setWaveBars(){
	//wait just a bit to make sure that any resize has finished
	clearTimeout(params.waveWait);
	params.waveWait = setTimeout(function(){
		console.log('waving bars ...')
		params.wavingBars = true;
		params.waveTimeouts = new Array(params.selectionWords.length);
		waveBars();
		params.waveInterval = setInterval(waveBars, params.transitionWaveDuration);
	}, 3000);

}

function waveBars(){
	//show bars waving until user submits the data
	params.selectionWords.forEach(function(c,j){
		var thisPlot = d3.select('#'+params.cleanString(c)+'_bar');

		params.waveTimeouts[j] = setTimeout(function(){
			params.options.forEach(function(o,i){
				if (o != 'Select Category'){
					var vPrev = params.dummyData[params.cleanString(c)][i-1].value;
					var v = 0;
					if (vPrev == 0){
						v = 1;
					}
					var dat = {"category":params.cleanString(o), "value":v}
					params.dummyData[params.cleanString(c)][i-1] = dat
				}
			});
			updateBars(thisPlot, params.dummyData[params.cleanString(c)], params.transitionWaveDuration, d3.easeLinear, params.barOpacity);
		}, params.transitionWaveDuration*j/params.selectionWords.length)
	});
}

function showParaAnswers(){
	var using = params.answers.filter(function(d){return (d.task == 'para' && params.cleanString(d.paragraphname) == params.cleanString(params.paragraphname));})[0];
	Object.keys(using).forEach(function(k,i){
		if (k != 'task' && k != 'paragraphname'){
			var d = d3.select('#'+params.cleanString(k)+'_bar').select('.barHover.'+using[k])
				.style('stroke','black')
				.style('stroke-width',2)
				.style('stroke-opacity',function(){
					if (params.transitionParaAnswers) return 0;
					return 1;
				})
				.classed('answerBorder', true)
		}
		if (i == Object.keys(using).length - 1) {
			toggleParaAnswers();
			params.transitionParaAnswers = false;
		}
	})

	if (!params.showParaAnswers){
		d3.selectAll('.answerBorder').style('stroke-opacity',0);
	}

}

function toggleParaAnswers(){
	var op = 0;
	if (params.showParaAnswers) op = 1;
	d3.selectAll('.answerBorder').transition().duration(params.transitionDuration).style('stroke-opacity',op)
}

function switchParaVersions(){
	if (this.name == "version"){
		params.paraResponseVersion = this.value;
		params.toggleParaText = true;
		if (params.paraSubmitted) {
			initParaAggDateUI(params.transitionDuration);
			defineBars();
		}
		updateNresponses();
	}
	if (this.name == "answers"){
		params.showParaAnswers = this.checked;
		toggleParaAnswers();
	}
}
