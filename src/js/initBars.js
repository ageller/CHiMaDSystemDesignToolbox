//this function will use the answers to create a grid of boxes and highlight the correct values
//TO DO
// -- I need to get the measurements to scale (not sure what this means)
// -- add tooltips
// -- is this better than the boxes?


params.haveBars = true;

//version options
d3.select('#paraVersionOptions').selectAll('input').on('change',switchParaVersions);

function createBars(){
	params.createdBars = false;
	console.log('!!! creating bars', params.selectionWords)
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

	var bbI = d3.select('#usernameInstructions').node().getBoundingClientRect();
	var bbV = d3.select('#paraVersionOptions').node().getBoundingClientRect();
	var fsp = Math.min(Math.max(0.01*window.innerWidth, params.paraFSmin), params.maxPlotFont);

	//check whether we are plotting this in side-by-side w/ paragraph or top-bottom
	var offset = 4;
	var plotSSWidth = window.innerWidth*params.plotFraction;
	var minPlotHeight = params.selectionWords.length*(params.minBarHeight + offset);
	var totalWidth,totalHeight;
	//console.log('check widths', window.innerWidth, plotSSWidth, window.innerWidth - plotSSWidth, params.minPlotWidth, params.minParaWidth)
	if (plotSSWidth >= params.minPlotWidth && (window.innerWidth - plotSSWidth >= params.minParaWidth) ){
		//side-by-side view
		console.log('plot side-by-side view')
		totalWidth = plotSSWidth;
		totalHeight = Math.max(window.innerHeight - bbI.height - bbV.height - 20, minPlotHeight);
	} else {
		//top-bottom view
		console.log('plot top-bottom view')
		totalWidth = window.innerWidth -100;
		totalHeight = minPlotHeight;
	}


	//It would be better to determine these margins based on the plot size and font size!  I will resize this later after the text is added
	params.boxGridSVGMargin = {"top":20,"bottom":0.2*totalHeight,"left":0.7*totalWidth,"right":20};
	params.boxGridSVGHeight = totalHeight - params.boxGridSVGMargin.top - params.boxGridSVGMargin.bottom;
	params.boxGridSVGHistHeight = params.boxGridSVGHeight/params.selectionWords.length - offset;
	//make the bars squares, factor of 1.3 just judged by eye to make approximately square
	params.boxGridSVGWidth = Math.min((params.boxGridSVGHistHeight*1.3)*(params.options.length-1), 0.5*window.innerWidth); //one option is 'Select Category'
	//params.boxGridSVGWidth = totalWidth - params.boxGridSVGMargin.left - params.boxGridSVGMargin.right;
	console.log('check widths', window.innerWidth, plotSSWidth, window.innerWidth - plotSSWidth, params.minPlotWidth, params.minParaWidth, params.boxGridSVGHistHeight, params.boxGridSVGWidth, totalHeight)

	
	params.boxGridSVG = d3.select('#boxGridSVGContainer').append('svg')
		.style('height',params.boxGridSVGHeight + params.boxGridSVGMargin.top + params.boxGridSVGMargin.bottom)
		.style('width',params.boxGridSVGWidth + params.boxGridSVGMargin.left + params.boxGridSVGMargin.right)
		.append("g")
			.attr("id","boxGridPlotContainer")
			.attr("transform", "translate(" + params.boxGridSVGMargin.left + "," + params.boxGridSVGMargin.top + ")");


	params.barOpacity = 0.2;

	//create the grid of histograms (using svg rects)
	params.selectionWords.forEach(function(c,j){

		//set up dummy data so that I can define the visualization ahead of time 
		//this may be a bit of a waste of memory, but I can't think of a better way to enable the waving feature that I want :)
		params.dummyData[params.cleanString(c)] = [];
		params.options.forEach(function(o, i){
			if (o != 'Select Category'){
				//var v = (j/params.selectionWords.length + i/params.options.length) % 1;
				var dat = {"category":o, "value":0}
				params.dummyData[params.cleanString(c)].push(dat);
			}
		});

		var thisPlot = params.boxGridSVG.append('g')
			.attr('id',params.cleanString(c)+'_bar')
			.attr("transform", "translate(0," + (params.boxGridSVGHistHeight + offset)*j + ")")

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

		// add blank rects for hovering
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
				.attr("transform", "translate(0," + params.boxGridSVGHistHeight + offset*j + ")")
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
				.attr("transform", "translate(0," + params.boxGridSVGHistHeight + offset*j + ")")
				.call(d3.axisBottom(params.boxGridxScale).tickValues([]).tickSize(0));
		}

		// // add the y Axis
		// thisPlot.append("g")
		// 	.call(d3.axisLeft(params.boxGridyScale).tickValues([]).tickSize(0));

		fsp = resizeBarPlot();

		//add the labels for the y axis
		thisPlot.append("text")
			.attr('class','rowLabel')
			.attr("x","-5px")
			.attr("y",params.boxGridSVGHistHeight)
			//.attr("dy", "-1em")
			.style("text-anchor", "end")
			.style("font-size",fsp)
			.html(c.replaceAll("<sub>","<tspan dy=5>").replaceAll("</sub>","</tspan><tspan dy=-5>"));  //I'm not closing the last tspan, but it seems OK 


	});


	params.createdBars = true;

	//show the bars
	console.log("showing results", params.showingResults)
	if (params.showingResults){
		defineBars();
	} else {
//		if (!params.wavingBars)setWaveBars();
	}
}

function resizeBarPlot(){
	//resize the margins and plot as necessary, given the labels
	resizeBars();
	var fsp = Math.min(Math.max(0.01*window.innerWidth, params.paraFSmin), params.maxPlotFont);

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
		resizeBars();
	}

	return fsp

}
function resizeBars(){
	var maxW = 0;
	d3.selectAll('.rowLabel').each(function(d){
		if (this.getBoundingClientRect().width > maxW) maxW = this.getBoundingClientRect().width;
	})
	var maxH = 0;
	d3.selectAll('.columnLabel').each(function(d){
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
				var dat = {"category":o, "value":v}
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
			var txt = elem.text().replaceAll('*','');
			elem.text('**'+txt+'**')
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
	resize();


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
					var dat = {"category":o, "value":v}
					params.dummyData[params.cleanString(c)][i-1] = dat
				}
			});
			updateBars(thisPlot, params.dummyData[params.cleanString(c)], params.transitionWaveDuration, d3.easeLinear, params.barOpacity);
		}, params.transitionWaveDuration*j/params.selectionWords.length)
	});
}

function showParaAnswers(){
	var using = params.answers.filter(function(d){return (d.task == 'para');})[0];

	params.answers.columns.forEach(function(k,i){
		if (k != 'task'){
			var d = d3.select('#'+params.cleanString(k)+'_bar').select('.barHover.'+using[k])
				.style('stroke','black')
				.style('stroke-width',2)
				.style('stroke-opacity',function(){
					if (params.transitionParaAnswers) return 0;
					return 1;
				})
				.classed('answerBorder', true)
		}
		if (i == params.answers.columns.length - 1) {
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
		if (params.paraSubmitted) defineBars();
	}
	if (this.name == "answers"){
		params.showParaAnswers = this.checked;
		toggleParaAnswers();
	}
}
// function handleBarMouseOut(){
// 	if (params.showingResults){
// 		var x = event.clientX;
// 		var y = event.clientY;
// 		var elem = document.elementFromPoint(x, y);
// 		if (elem.id != "tooltip"){
// 			d3.select('#tooltip').transition().duration(params.transitionDuration).style('opacity',0);
// 			d3.selectAll('.bar').transition().duration(params.transitionDuration).style('opacity',params.barOpacity);
// 		}
// 	}
// }

// function handleBarMouseOver(){
// 	if (params.showingResults){
// 		var classes = this.classList;
// 		var bar = d3.select(this.parentNode).select('.bar.'+classes[1]);
// 		var bbox = d3.select(this).node().getBoundingClientRect();//getBBox();

// 		//update and show the tooltip
// 		d3.select('#tooltip')
// 			.style('top',bbox.y)
// 			.style('left',bbox.x)
// 			.style('width',bbox.width)
// 			.style('height',bbox.height)
// 			.text(parseFloat(bar.attr('data-pct')).toFixed(1))
// 			.transition().duration(params.transitionDuration).style('opacity',1);
		
// 		//dim all the bars
// 		d3.selectAll('.bar').transition().duration(params.transitionDuration).style('opacity',0.2);

// 		//highlight the bar where on
// 		bar.transition().duration(params.transitionDuration).style('opacity',1);
// 	}


// }