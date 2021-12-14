
//see example here: https://www.d3-graph-gallery.com/graph/histogram_basic.html
function binData(settings){
	// set the parameters for the histogram
	// get the bin locations
	var rng = Math.max(settings.xAxis.domain()[1] - settings.xAxis.domain()[0], 1); 
	var dx = rng/settings.nBins;
	var order = Math.floor(Math.log(rng)/Math.LN10 + 0.000000001); // extra addon in case float is not correct
	var dec = Math.pow(10,order);
	var bins = [settings.xAxis.domain()[0]]
	for (var i=0; i< settings.nBins; i++) {
		bins.push(Math.round((bins[i] + dx)*dec)/dec)
	}
	bins[bins.length - 1] = settings.xAxis.domain()[1] + 0.1*dx; //to ensure that any items at the edge is included

	var histogram = d3.histogram()
		.value(function(d){return(d)})
		.domain(settings.xAxis.domain())  
		//.thresholds(settings.xAxis.ticks(settings.nBins)); //not exact enough!
		.thresholds(bins); //not exact enough!

	return histogram(settings.data);
}

function createHistogram(settings){

	//destroy the plot (if it exists)
	var parent = settings.container.node();
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}

	settings.zoomed = false;

	//redefine the width
	settings.histWidth = settings.widthFrac*settings.parent.node().getBoundingClientRect().width;

	//create the SVG element
	var w = settings.histWidth + settings.histMargin.left + settings.histMargin.right;
	var h = settings.histHeight + settings.histMargin.top + settings.histMargin.bottom;
	settings.svg = settings.container.append('svg')
			.attr('width', w + 'px')
			.attr('height', h + 'px')
			.append('g')
				.attr('transform', 'translate(' + settings.histMargin.left + ',' + settings.histMargin.top + ')');

	//data limits
	settings.minX = settings.data[0];
	settings.maxX = settings.data[0];
	settings.data.forEach(function(d,i){
		settings.minX = Math.min(settings.minX, d);
		settings.maxX = Math.max(settings.maxX, d);
	})
	var rng = settings.maxX - settings.minX;
	if (rng > 0){
		settings.minX -= 0.01*rng;
		settings.maxX += 0.01*rng;

		// X axis: scale and draw:
		settings.xAxis = d3.scaleLinear()
			.domain([settings.minX, settings.maxX])     
			.range([0, settings.histWidth]);
		settings.svg.append('g')
			.attr('transform', 'translate(0,' + settings.histHeight + ')')
			.attr('id','xaxis' + settings.idAddOn)
			.call(d3.axisBottom(settings.xAxis)
					.ticks(settings.Nxticks)
					//.tickFormat('') //formatting axis labels below, since I want a line break
			);

		appendXAxisLabels(settings);

		//bin the data for the three different categories
		settings.histAll = binData(settings);

		// Y axis: scale and draw:
		settings.yAxis = d3.scaleLinear()
			.range([settings.histHeight, 0]);
		settings.yAxis.domain([0, Math.max(d3.max(settings.histAll, function(d) { return d.length; }), 1)]).nice();  
		settings.svg.append('g')
			.attr('id','yaxis' + settings.idAddOn)
			.call(d3.axisLeft(settings.yAxis).ticks(settings.Nyticks));

		// text label for the x axis
		settings.svg.append('text')             
			//.attr('transform', 'translate(' + (settings.histWidth/2) + ',' + (settings.histHeight + settings.histMargin.top + 24) + ')')
			.attr('x', settings.histWidth/2)
			.attr('y',settings.histHeight + settings.histMargin.top + 40)
			.style('text-anchor', 'middle')
			.style('font','12px sans-serif')
			.text(settings.xAxisLabel)

		// text label for the y axis
		settings.svg.append('text')
			.attr('text-anchor', 'end')
			.attr('x', -settings.histHeight/2)
			.attr('y', -24)
			.attr('transform', 'rotate(-90)')
			.style('text-anchor', 'middle')
			.style('font','12px sans-serif')
			.text(settings.yAxisLabel);

		// append the bar rectangles to the svg element
		settings.svg.selectAll('.bar' + settings.idAddOn)
			.data(settings.histAll).enter()
			.append('rect')
				.attr('class','bar' + settings.idAddOn)
				.attr('x', 1)
				.attr('transform', function(d) { return 'translate(' + settings.xAxis(d.x0) + ',' + settings.yAxis(d.length) + ')'; })
				.attr('width', function(d) { return Math.max(settings.xAxis(d.x1) - settings.xAxis(d.x0) - 2 ,0) + 'px' ; }) //-val to give some separation between bins
				.attr('height', function(d) { return settings.histHeight - settings.yAxis(d.length) + 'px'; })
				.attr('stroke-width',1)
				.attr('stroke', 'black')
				.style('fill', settings.fillColor)
				.style('cursor','pointer')

		//brush
		var brush = d3.brushX()
			.extent( [ [0,0], [settings.histWidth,settings.histHeight] ] )
			.on('end', brushEnded);

		settings.svg.append('g')
			.attr('class', 'brush')
			.call(brush)
			.on('dblclick', dblclick);
	}

	function brushEnded(event){
		if (event.selection){
			settings.zoomed = true;
			const [x0, x1] = event.selection.map(settings.xAxis.invert);
			settings.dateAggLims[0] = new Date(x0)
			settings.dateAggLims[1] = new Date(x1)
			d3.select(this).call(brush.move, null);
			//updateHistogram(settings, settings.transitionDuration);
			//re-aggregate the results and then replot
			settings.brushCallback()

		} 
	}

	function dblclick(){
		settings.zoomed = false;
		settings.resetCallback();
	}

	d3.selectAll('#xaxis' + settings.idAddOn +' .tick').each(function(){
		var x = parseTranslateAttr(this).x;
		var t = new Date(settings.xAxis.invert(x)).toLocaleString();
	})

}

function appendXAxisLabels(settings){
	d3.selectAll('#xaxis' + settings.idAddOn +' .tick').each(function(){
		var x = parseTranslateAttr(this).x;
		var t = new Date(settings.xAxis.invert(x)).toLocaleString();
		var el = d3.select(this)//.select('text');
		insertLinebreaks(el, t);
	})
}

//https://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
function insertLinebreaks(el, text) {
	//var text = el.text();
	//var words = text.split('\n');
	try {
		elText = el.select('text')
		var words = text.split(',');
		elText.text('');
		for (var i = 0; i < words.length; i++) {
			var tspan = elText.append('tspan').text(words[i]);
			if (i > 0) tspan.attr('x', 0).attr('dy', '15');
		}
	}
	catch(err){
		console.log('cannot create axis label', el, text)
	}
};

function updateHistogram(settings, dur, resetY = true){
	
	if (settings.xAxis){

		if (!settings.zoomed) params.SDCHist.resetDateCallback();

		//rescale the x axes
		settings.minX = settings.dateAggLims[0].getTime();
		settings.maxX = settings.dateAggLims[1].getTime();
		//console.log(new Date(settings.minX), new Date(settings.maxX))
		settings.xAxis.domain([settings.minX, settings.maxX])  
		d3.select('#xaxis' + settings.idAddOn).transition().duration(dur)
			.call(d3.axisBottom(settings.xAxis)
					.ticks(settings.Nxticks)
					.tickFormat('') //formatting axis labels below, since I want a line break
			)
		setTimeout(function(){appendXAxisLabels(settings);}, dur);


		//update the data
		settings.histAll = binData(settings);
		settings.svg.selectAll('.bar' + settings.idAddOn).data(settings.histAll);

		//rescale the y axis?
		if (resetY){
			settings.yAxis.domain([0, Math.max(d3.max(settings.histAll, function(d) { return d.length; }), 1)]).nice();  
			var domain = settings.yAxis.domain()
			d3.select('#yaxis' + settings.idAddOn).transition().duration(dur)
				.call(d3.axisLeft(settings.yAxis)
					.ticks(settings.Nyticks)
				);
		}

		settings.svg.selectAll('.bar' + settings.idAddOn).transition().duration(dur)
			.attr('transform', function(d, i) { return 'translate(' + settings.xAxis(d.x0) + ',' + settings.yAxis(d.length) + ')'; })
			.attr('height', function(d,i) { return settings.histHeight - settings.yAxis(d.length) + 'px'; })
	}

}

