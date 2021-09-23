//attach function to buttons
document.getElementById('SDCEditButton').onclick = beginSDCEdit;
document.getElementById('SDCDoneButton').onclick = endSDCEdit;
params.haveSDCEditor = true;
//params.SDCSubmitted = true;

//need a button to change the view from the "answers" to the most popular

var columnWords = params.options.filter(function(d){return d != 'Select Category'});
params.forceSimulation = null;

function beginSDCEdit(){
	console.log('editing SDC');

	//change button to done
	d3.select('#SDCEditButton').style('display','none');
	d3.select('#SDCDoneButton').style('display','block');

	//I think once you click edit, all the lines should be removed, and then also you won't be able to change the version anymore
	d3.select('#SDCVersion1').style('visibility','hidden');
	d3.select('#SDCVersion1label').style('visibility','hidden');
	d3.select('#SDCVersion2').style('visibility','hidden');
	d3.select('#SDCVersion2Label').style('visibility','hidden');
	d3.select('#SDCAnswerToggle').style('visibility','hidden');
	d3.select('#SDCAnswerToggleLabel').style('visibility','hidden');
	d3.select('#SDCVersionOptions').style('visibility','hidden');
	d3.selectAll('line').remove();
	d3.selectAll('circle').remove();
	d3.selectAll('.SDCAggregateFracBox').remove();


	//update the url to remove all the connections
	params.URLInputValues = {};
	resetURLdata();
	params.URLInputValues['groupname'] = params.groupname;
	appendURLdata();

	//turn off the ability to draw lines
	d3.selectAll('.SDCrectContainer').on('mousedown', null);

	//add the ability to move the rects
	//the transform defines the position (so that I can move the rect and text)
	//the x,y attributes are used to connect the lines

	var elems = populateElems();
	var leftsX = [];
	columnWords.forEach(function(column){
		leftsX.push(params.SDCColumnCenters[column] - params.SDCBoxWidth/2.);
	})
	var offsetX, offsetY, iX;

	//set up the drag controller
	var dragHandler = d3.drag()
		.on("start", dragStart)
		.on("drag", dragMove)
		.on("end", dragEnd)

	dragHandler(params.SDCSVG.selectAll('.SDCrectContainer'));


	//functions supporting dragging
	function dragStart(){
		var elem = this;
		var trans = parseTranslateAttr(elem);
		elem.x = trans.x;
		elem.y = trans.y;
		elem.x0 = elem.x;
		elem.y0 = elem.y;
		offsetX = event.x - trans.x;
		offsetY = event.y - trans.y;

		//take away the color so it's obvious this is selected
		columnWords.forEach(function(w){
			d3.select(elem).select('rect').classed(w, false);
			d3.select(elem).select('rect').classed(w+'Word', false);
		})
		d3.select(this).select('rect').classed('blankRect', true);

		//it would be nice to move the selected element to the front, but you can't easily do this in d3
	}

	function dragEnd(){
		//add back the color
		d3.select(this).select('rect').classed('blankRect', false);
		d3.select(this).select('rect').classed(columnWords[iX]+'Word', true);
		d3.select(this).select('rect').classed(columnWords[iX], true)
	}

	function dragMove(){
		if (!d3.select(this).classed('rectMoving')){
			var elem = this;
			var x = Math.max(event.x - offsetX, 0.);
			var y = Math.max(event.y - offsetY, 0.);
			var needReorder = false;

			//snap to the column location
			//get the closest column
			iX = 0;
			var dist = 1e10;
			leftsX.forEach(function(d,i){
				var dtmp = Math.abs(x - d);
				if (dtmp < dist){
					dist = dtmp;
					iX = i; 
				}
			})
			x = leftsX[iX];
			if (elem.column != columnWords[iX]){
				console.log('changing columns');
				//set the y location to be at the top of the new group;
				// var top = 1e10;
				// elems[columnWords[iX]].forEach(function(d){
				// 	if (d.y < top) top = d.y;
				// })
				// console.log(columnWords[iX], top, y)
				// y = top - elem.height - 10.;
				// elem.y0 = y;

				//shift the groups up and down to keep things centered
				const index = elems[elem.column].indexOf(elem);
				if (index > -1) {
					console.log('found elem in column list')
					elems[elem.column].splice(index, 1);
					elems[columnWords[iX]].push(elem);
				}
				elem.column = columnWords[iX];
				needReorder = true;
			}

			//now check on the y location... this will require moving other boxes.
			var yNew = handleOverlaps(elems, elem, y);

			if (yNew != elem.y0) needReorder = true;



			//now update the position of the selected box
			elem.x0 = x;
			elem.x = x;		
			elem.y0 = yNew;
			elem.y = yNew;
			d3.select(elem)
				.attr('x', elem.x)
				.attr('y', elem.y);

			if (needReorder){
				//have swapped positions
				reorderWords(elems, elem);
				formatSDC(100);
				elems = populateElems();

				//take away the color so it's obvious this is selected (redo, since it was reset with formatSDC)
				columnWords.forEach(function(w){
					d3.select(elem).select('rect').classed(w, false);
					d3.select(elem).select('rect').classed(w+'Word', false);
				})
				d3.select(this).select('rect').classed('blankRect', true);

			}
			// d3.select(elem).transition().duration(100)
			// 	.on('start',function(){
			// 		d3.select(this).classed('rectMoving', true)
			// 	})
			// 	.on('end', function(){
			// 		d3.select(this).classed('rectMoving', false)
			// 	})
			// 	.attr('transform', 'translate(' + elem.x + ',' + elem.y + ')')
		}

	}


	function handleOverlaps(elems, elem, y){
		var yNew = y;

		//now move the adjacent rects
		console.log(elem.column)
		elems[elem.column].filter(function(d){return d != elem;}).forEach(function(t,i){
			//console.log('checking overlap', i, t.y, t.height, y, elem.height, y + elem.height, t.y + t.height, d3.select(t).text());
			if ( (y + elem.height/2.) > t.y && y < (t.y + t.height) && !d3.select(t).classed('rectMoving')){
				console.log('overlap', i, t.y, t.height, y, elem.height, y + elem.height, t.y + t.height);
				var yOther;
				if (elem.y0 < y){
					//console.log('moving down');
					yOther = t.y - elem.height - 10;
					yNew = t.y + t.height - elem.height;
				} else {
					//console.log('moving up')
					yOther = t.y + elem.height + 10;
					yNew = t.y;
				}
				t.y = yOther;
				this.y = yOther
				d3.select(t).attr('y',yOther);
				// d3.select(t).transition().duration(100)
				// 	.on('start',function(){
				// 		d3.select(this).classed('rectMoving', true)
				// 		handleOverlaps(elems, this, yOther);
				// 		this.y = yOther;
				// 	})
				// 	.on('end', function(){
				// 		d3.select(this).classed('rectMoving', false)
				// 	})
				// 	.attr('transform','translate(' + t.x + ',' + yOther + ')')
			}
		})
		//console.log(y, yNew)
		if (yNew != y){
			y = Math.min(Math.max(yNew, 20.), parseFloat(d3.select('#SDCPlotSVG').style('height')) - elem.height); //keep it within the box (just in case something goes wrong)
		} else {
			y = elem.y0;
		}

		return y;

	}

	function reorderWords(elems, elem){

		//reset the answer for this word (in case the column changed)
		var word = params.cleanString(d3.select(elem).select('text').attr('orgText'));
		params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0][word] = elem.column;

		//reorder params.selectionWords so that I can use formatSDC
		var words = [];
		var wordsY = [];
		columnWords.forEach(function(column){
			elems[column].forEach(function(d){
				words.push(d3.select(d).select('text').attr('orgText')); //note that this will have recoded <sub> to $
				wordsY.push(parseFloat(d.y));
			})
		})
		words.sort(function(a, b){  
			var i1 = words.indexOf(a);
			var i2 = words.indexOf(b);
			return wordsY[i1] - wordsY[i2];
		});
		params.selectionWords = words;
	}

	function populateElems(){
		var e = {};

		columnWords.forEach(function(column){
			e[column] = [];

			d3.selectAll('.SDCrectContainer.'+column).each(function(){
				this.x = params.SDCColumnCenters[column] - params.SDCBoxWidth/2.;
				this.x0 = params.SDCColumnCenters[column] - params.SDCBoxWidth/2.;
				this.y = parseFloat(d3.select(this).attr('y'));
				this.y0 = parseFloat(d3.select(this).attr('y'));
				this.height = parseFloat(d3.select(this).select('rect').attr('height'));
				this.width = params.SDCBoxWidth;
				this.column = column;

				e[column].push(this);
			})
		})

		return e;
	}
}



function endSDCEdit(){
	console.log('done editing SDC');

	//change button to edit
	d3.select('#SDCEditButton').style('display','block');
	d3.select('#SDCDoneButton').style('display','none');

	//allow the user to make new responses, but not show any of the other options
	d3.select('#SDCVersionOptions').style('visibility','visible');

	//allow the user to add lines
	d3.selectAll('.SDCrectContainer').on('mousedown', startSDCLine);

	//remove the availity to drag the rects
	params.SDCSVG.selectAll('.SDCrectContainer').on('mousedown.drag', null);

	//end the force simulation
	if (params.forceSimulation) params.forceSimulation.stop();
}
