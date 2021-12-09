
//see example here: https://www.d3-graph-gallery.com/graph/histogram_basic.html
function binData(settings){
	// set the parameters for the histogram
	var histogram = d3.histogram()
		.value(function(d){ return(d)})
		.domain(settings.xAxis.domain())  
		.thresholds(settings.xAxis.ticks(settings.nBins)); 

	return histogram(settings.data);
}

function createHistogram(settings){

	//destroy the plot (if it exists)
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	//create the SVG element
	var w = settings.histWidth + settings.histMargin.left + settings.histMargin.right;
	var h = settings.histHeight + settings.histMargin.top + settings.histMargin.bottom;
	settings.svg = settings.container.append('svg')
			.attr('width', w + 'px')
			.attr('height', h + 'px')
			.append('g')
				.attr('transform', 'translate(' + settings.histMargin.left + ',' + settings.histMargin.top + ')');

	//data limits
	settings.minX = 1e10
	settings.maxX = -1e10
	settings.data.forEach(function(d){
		settings.minX = Math.min(settings.minX, d);
		settings.maxX = Math.max(settings.maxX, d);
	})
	var rng = settings.maxX - settings.minX;
	settings.minX -= 0.01*rng;
	settings.maxX += 0.01*rng;

	// X axis: scale and draw:
	settings.xAxis = d3.scaleLinear()
		.domain([settings.minX, settings.maxX])     
		.range([0, settings.histWidth]);
	settings.svg.append('g')
		.attr('transform', 'translate(0,' + settings.histHeight + ')')
		.call(d3.axisBottom(settings.xAxis).ticks(settings.Nxticks));


	//bin the data for the three different categories
	settings.histAll = binData(settings);
	console.log('have binned data', settings.histAll);

	// Y axis: scale and draw:
	settings.yAxis = d3.scaleLinear()
		.range([settings.histHeight, 0]);
	settings.yAxis.domain([0, d3.max(settings.histAll, function(d) { return d.length; })]);   
	settings.svg.append('g')
		.call(d3.axisLeft(settings.yAxis).ticks(settings.Nyticks));

	// text label for the x axis
	settings.svg.append('text')             
		//.attr('transform', 'translate(' + (settings.histWidth/2) + ',' + (settings.histHeight + settings.histMargin.top + 24) + ')')
		.attr('x', settings.histWidth/2)
		.attr('y',settings.histHeight + settings.histMargin.top + 6)// + 24)
		.style('text-anchor', 'middle')
		.style('font','16px sans-serif')
		.text(settings.xAxisLabel)

	// text label for the y axis
	settings.svg.append('text')
		.attr('text-anchor', 'end')
		.attr('x', -settings.histHeight/2)
		.attr('y', -24)
		.attr('transform', 'rotate(-90)')
		.style('font','16px sans-serif')
		.text(settings.yAxisLabel);

	// append the bar rectangles to the svg element
	settings.svg.selectAll('.bar')
		.data(settings.histAll).enter()
		.append('rect')
			.attr('class','bar')
			.attr('x', 1)
			.attr('transform', function(d) { return 'translate(' + settings.xAxis(d.x0) + ',' + settings.yAxis(d.length) + ')'; })
			.attr('width', function(d) { return Math.max(settings.xAxis(d.x1) - settings.xAxis(d.x0) -3 ,0) + 'px' ; }) //-val to give some separation between bins
			.attr('height', function(d) { return settings.histHeight - settings.yAxis(d.length) + 'px'; })
			.attr('stroke-width',1)
			.attr('stroke', 'black')
			.style('fill', settings.fillColor)
}


function changeHistogram(arg){
	//console.log(arg)

	settings.isTypeB = false;
	settings.isTypeA = false;
	if (arg.includes('TypeB')) settings.isTypeB = true;
	if (arg.includes('TypeA')) settings.isTypeA = true;

	showNames();
	settings.svg.selectAll('.bar').data(params[arg]);

	//rescale the y axis?
	//settings.yAxis.domain([0, d3.max(params[arg], function(d) { return d.length; })]);   

	settings.svg.selectAll('.bar').transition().duration(settings.duration)
		.attr('transform', function(d, i) { return 'translate(' + settings.xAxis(d.x0) + ',' + settings.yAxis(d.length) + ')'; })
		.attr('height', function(d,i) { return settings.histHeight - settings.yAxis(d.length) + 'px'; })
		.style('fill', settings.fillColor)

}

