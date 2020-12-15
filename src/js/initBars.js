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
	var offset = 1;
	params.svgHistHeight = params.svgHeight/params.selectionWords.length - offset;
	params.svgWidth = params.svgHistHeight*params.options.length
//	params.svgWidth = window.innerWidth*0.5 - params.svgMargin.left - params.svgMargin.right - 40; //40 is from the padding on the outer div

	params.svg = d3.select('#svgContainer').append('svg')
		.style('height',params.svgHeight + params.svgMargin.top + params.svgMargin.bottom)
		.style('width',params.svgWidth + params.svgMargin.left + params.svgMargin.right)
		.append("g")
		.attr("transform", "translate(" + params.svgMargin.left + "," + params.svgMargin.top + ")");


	//set up dummy data so that I can define the visualization ahead of time 
	var dummyData = []
	params.options.forEach(function(o){
		if (o != 'Select Category'){
			var dat = {"category":o, "value":0.5}
			dummyData.push(dat);
		}
	});

	//create the grid of histograms (using svg rects)
	params.selectionWords.forEach(function(c,j){
		var thisPlot = params.svg.append('g')
			.attr('id',params.cleanString(c)+'_bar')
			.attr("transform", "translate(0," + (params.svgHistHeight + offset)*j + ")")

		// set the ranges
		params.xScale = d3.scaleBand()
			.range([0, params.svgWidth])
			.padding(0.1)
			.domain(dummyData.map(function(d) { return d.category; }));
		params.yScale = d3.scaleLinear()
			.range([params.svgHistHeight, 0])
			.domain([0,1]);

		//add the histograms
		thisPlot.selectAll(".bar")
			.data(dummyData).enter().append("rect")
				.attr("class","bar")
				.attr("x", function(d) { return params.xScale(d.category); })
				.attr("width", params.xScale.bandwidth())
				.attr("y", function(d) { return params.yScale(d.value); })
				.attr("height", function(d) { return params.svgHistHeight - params.yScale(d.value); })
				//.style("fill","#274d7e")
				.style("fill",function(d){return params.colorMap(d.value);})

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


	// resizer();
}

function defineBars(){
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

		thisPlot.selectAll('.bar')
			.data(realData).transition().duration(1000)
				.attr("x", function(d) { return params.xScale(d.category); })
				.attr("y", function(d) { return params.yScale(d.value); })
				.attr("height", function(d) { return params.svgHistHeight - params.yScale(d.value); })
				.style("fill",function(d){return params.colorMap(d.value);})
	})
}

