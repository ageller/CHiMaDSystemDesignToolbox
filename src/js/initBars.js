//this function will use the answers to create a grid of boxes and highlight the correct values
//TO DO
// -- I need to get the measurements to scale
// -- add tooltips
// -- is this better than the boxes?
// -- make the dummy data move up and down until the submit button is clicked?
// -- take only the most recent version of results for each person
// -- add in the correct answers and the identification of incorrect responses from the aggregate
function createBars(){

	//get all the rows
	d3.selectAll('.selectionWord').select('text').each(function(d){
		params.selectionWords.push(this.innerHTML);
	})

	params.svgMargin = {"top":20,"bottom":180,"left":450,"right":50};
	params.svgHeight = window.innerHeight - params.svgMargin.top - params.svgMargin.bottom - 60;
	var offset = 4;
	params.svgHistHeight = params.svgHeight/params.selectionWords.length - offset;
	params.svgWidth = params.svgHistHeight*params.options.length
//	params.svgWidth = window.innerWidth*0.5 - params.svgMargin.left - params.svgMargin.right - 40; //40 is from the padding on the outer div

	params.svg = d3.select('#svgContainer').append('svg')
		.style('height',params.svgHeight + params.svgMargin.top + params.svgMargin.bottom)
		.style('width',params.svgWidth + params.svgMargin.left + params.svgMargin.right)
		.append("g")
			.attr("id","plotContainer")
			.attr("transform", "translate(" + params.svgMargin.left + "," + params.svgMargin.top + ")");


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

		var thisPlot = params.svg.append('g')
			.attr('id',params.cleanString(c)+'_bar')
			.attr("transform", "translate(0," + (params.svgHistHeight + offset)*j + ")")

		// set the ranges
		params.xScale = d3.scaleBand()
			.range([0, params.svgWidth])
			.padding(0.1)
			.domain(params.dummyData[params.cleanString(c)].map(function(d) { return d.category; }));
		params.yScale = d3.scaleLinear()
			.range([params.svgHistHeight, 0])
			.domain([0,1]);

		//add the histograms
		thisPlot.selectAll(".bar")
			.data(params.dummyData[params.cleanString(c)]).enter().append("rect")
				.attr("class",function(d){ return "bar " + d.category;})
				.attr("x", function(d) { return params.xScale(d.category); })
				.attr("width", params.xScale.bandwidth())
				.attr("y", function(d) { return params.yScale(d.value); })
				.attr("height", function(d) { return params.svgHistHeight - params.yScale(d.value); })
				//.style("fill","#274d7e")
				.style("fill",function(d){return params.colorMap(d.value);})
				.style("opacity", params.barOpacity)

		// add blank rects for hovering
		thisPlot.selectAll(".barHover")
			.data(params.dummyData[params.cleanString(c)]).enter().append("rect")
				.attr("class",function(d){ return "barHover " + d.category;})
				.attr("x", function(d) { return params.xScale(d.category); })
				.attr("width", params.xScale.bandwidth())
				.attr("y", params.yScale(1))
				.attr("height", params.svgHistHeight - params.yScale(1))
				.style("fill","white")
				.style("fill-opacity",0)
				.style("stroke", "none")
				.style("stroke-opacity",0)
				// .on("mouseover",handleBarMouseOver)
				// .on("mouseout",handleBarMouseOut);

		// add the x Axis
		if (j == params.selectionWords.length-1) {
			thisPlot.append("g")
				.attr("transform", "translate(0," + params.svgHistHeight + offset*j + ")")
				.call(d3.axisBottom(params.xScale))
				.selectAll("text")
					.attr("y", 0)
					.attr("x", -9)
					.attr("dy", ".35em")
					.attr("transform", "rotate(-90)")
					.style("text-anchor", "end")
					.style("font-size","16px")
					.attr('class',function(d){return params.cleanString(d)+'Word'})
		}else{
			thisPlot.append("g")
				.attr("transform", "translate(0," + params.svgHistHeight + offset*j + ")")
				.call(d3.axisBottom(params.xScale).tickValues([]).tickSize(0));
		}

		// // add the y Axis
		// thisPlot.append("g")
		// 	.call(d3.axisLeft(params.yScale).tickValues([]).tickSize(0));

		//add the label
		thisPlot.append("text")
			.attr("x","-5px")
			.attr("y",params.svgHistHeight)
			//.attr("dy", "-1em")
			.style("text-anchor", "end")
			.style("font-size","16px")
			.html(c.replaceAll("<sub>","<tspan dy=5>").replaceAll("</sub>","</tspan><tspan dy=-5>"));  //I'm not closing the last tspan, but it seems OK 

	});

	params.waveTimeouts = new Array(params.selectionWords.length);
	waveBars();
	params.waveInterval = setInterval(waveBars, params.transitionWaveDuration);

	resize();
}

function updateBars(thisPlot, data, duration, easing, op){
	//update the data in a bar chart
	return thisPlot.selectAll('.bar')
		.data(data).transition().ease(easing).duration(duration)
			.attr("x", function(d) { return params.xScale(d.category); })
			.attr("y", function(d) { return params.yScale(d.value); })
			.attr("height", function(d) { return params.svgHistHeight - params.yScale(d.value); })
			.style("fill",function(d){return params.colorMap(d.value);})
			.style("opacity", op)
			.attr('data-pct',function(d) { return d.value;})

}

function defineBars(){
	params.barOpacity = 1.;

	clearInterval(params.waveInterval);
	params.waveTimeouts.forEach(function(w){ clearTimeout(w); });

	//show the real aggregated data from the users
	params.selectionWords.forEach(function(c,j){
		var thisPlot = d3.select('#'+params.cleanString(c)+'_bar');

		//set up real data 
		var realData = []
		params.options.forEach(function(o){
			if (o != 'Select Category'){
				var v = params.aggregatedResponses[params.cleanString(c)].num[params.cleanString(o)]/params.responses.length || 0;
				var dat = {"category":o, "value":v}
				realData.push(dat);
			}
		});

		var update = updateBars(thisPlot, realData, params.transitionDuration, d3.easeLinear, params.barOpacity);
		thisPlot.selectAll('.text').data(realData).enter()
			.append('text')
				.attr("x", function(d) { return params.xScale(d.category) + params.xScale.bandwidth()/2.; })
				.attr("y", params.yScale(0.4))
				.style('font-size', 0.5*params.yScale(0))
				.style("text-anchor", "middle")
				.text(function(d){return parseFloat(d.value).toFixed(1);})

		if (j == params.selectionWords.length - 1){
			update.on("end", function(){params.showingResults = true})
		}
	});


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

function showAnswers(){
	console.log("answers",params.answers)
	params.answers.columns.forEach(function(k){
		d3.select('#'+k+'_bar').select('.barHover.'+params.answers[0][k])
			.style('stroke','black')
			.style('stroke-width',2)
			.style('stroke-opacity',1)
	})

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