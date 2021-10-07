//attach function to buttons
document.getElementById('SDCEditButton').onclick = beginSDCEdit;
document.getElementById('SDCDoneButton').onclick = endSDCEdit;
params.haveSDCEditor = true;
//params.SDCSubmitted = true;

//add a handler for the textarea boxes
window.addEventListener('click', useTextArea);

//compile options
d3.select('#SDCCompileOptions').selectAll('input').on('change',switchSDCCompiler);

//add a blank option to the groupname dropdown, but need to wait until the original is created
// var gInterval = window.setInterval(function(){
// 	var check = d3.select('#groupnameSelect').node();
// 	if (check){
// 		clearInterval(gInterval);
// 		params.availableGroupnames.push('blank');
// 		//create blank entries for the answers
// 		addEmptyAnswers('blank');
// 		console.log('!!! checking groupnames',params.availableGroupnames)
// 		createGroupnameSelect();
// 	}
// }, 100)


//attach a function to the save as png button
d3.select('#saveAsPNG').on('click',function(){
	var node = d3.select('#SDCPlotSVG').node();
	var bbox = node.getBoundingClientRect();
	// saveImage(node, bbox.width, bbox.height, 'SystemDesignChart.png');

	saveSvgAsPng(node, 'SystemDesignChart.png');
})

//attach a funciton to the save as pptx button
d3.select('#saveAsPPTX').on('click',saveAsPPTX);

var columnWords = lowerArray(params.options.filter(function(d){return d != 'Select Category'}));

columnWords.push('blankRect');

function beginSDCEdit(){
	console.log('editing SDC');
	params.editingSDC = true;
	params.edittedSDC = true

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
	d3.select('#SDCCompileOptions').style('visibility','hidden');
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
	//note: most of the visible movement occurs by calling formatSDC()

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

		if(event.detail > 1){ //to avoid the double clicks
			return;
		}

		var elem = this;
		var trans = parseTranslateAttr(elem);
		elem.x = trans.x;
		elem.y = trans.y;
		elem.x0 = elem.x;
		elem.y0 = elem.y;
		offsetX = event.x - trans.x;
		offsetY = event.y - trans.y;

		//it would be nice to move the selected element to the front, but you can't easily do this in d3
	}

	function dragEnd(){
		//add back the color
		d3.select(this).select('rect').classed('blankRect', false);
		if (columnWords[iX]){
			d3.select(this).select('rect').classed(columnWords[iX].toLowerCase()+'Word', true);
			d3.select(this).select('rect').classed(columnWords[iX].toLowerCase(), true);
		}
	}

	function dragMove(){
		var elem = this;

		//take away the color so it's obvious this is selected
		if (!d3.select(this).select('rect').classed('blankRect')){
			columnWords.forEach(function(w,i){
				if (w == elem.column) iX = i;
				d3.select(elem).select('rect').classed(w.toLowerCase(), false);
				d3.select(elem).select('rect').classed(w.toLowerCase()+'Word', false);
			})
			d3.select(this).select('rect').classed('blankRect', true);
		}

		if (!d3.select(this).classed('rectMoving')){
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
				//console.log('changing columns');

				//shift the groups up and down to keep things centered
				const index = elems[elem.column].indexOf(elem);
				if (index > -1) {
					//console.log('found elem in column list')
					elems[elem.column].splice(index, 1);
					elems[columnWords[iX]].push(elem);
				}
				elem.column = columnWords[iX];
				d3.select(elem).attr('column', elem.column);
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
					d3.select(elem).select('rect').classed(w.toLowerCase(), false);
					d3.select(elem).select('rect').classed(w.toLowerCase()+'Word', false);
				})
				d3.select(this).select('rect').classed('blankRect', true);

			}
		}

	}


	function handleOverlaps(elems, elem, y){
		var yNew = y;

		//now move the adjacent rects
		elems[elem.column].filter(function(d){return d != elem;}).forEach(function(t,i){
			if ( (y + elem.height/2.) > t.y && y < (t.y + t.height) && !d3.select(t).classed('rectMoving')){
				//console.log('overlap', i, t.y, t.height, y, elem.height, y + elem.height, t.y + t.height);
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
			}
		})
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
				words.push(d3.select(d).select('text').attr('orgText')); 
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

				d3.select(this).attr('column', column)

				e[column].push(this);
			})
		})

		return e;
	}

	//add the ability to edit the text in each box on double click
	params.SDCSVG.selectAll('.SDCrectContainer').on('dblclick', editSDCtext);
	function editSDCtext(){
		console.log('editting text', this);

		var elem = this;
		//take away the color so it's obvious this is selected
		columnWords.forEach(function(w,i){
			if (w == elem.column) iX = i;
			d3.select(elem).select('rect').classed(w.toLowerCase(), false);
			d3.select(elem).select('rect').classed(w.toLowerCase()+'Word', false);
		})
		d3.select(elem).select('rect').classed('blankRect', true);

		//remove the current text
		d3.select(elem).select('text').selectAll('tspan').remove();

		//create a text box with the original text
		var bbox = d3.select(elem).select('rect').node().getBoundingClientRect();

		var textarea = d3.select('#systemDesignChart').append('textarea')
			.attr('class', 'SDCTextEditorInput')
			.attr('name', 'editor')
			.attr('selector','#'+elem.id)
			.style('width',elem.width + 'px')
			.style('height',elem.height + 'px')
			.style('z-index',10)
			.style('position', 'absolute')
			.style('top', (bbox.top + window.scrollY - params.SDCSVGMargin.top)+ 'px') //not sure why this subtraction is needed for y and not x...
			.style('left',(bbox.left + window.scrollX) + 'px')

		textarea.node().value = d3.select(elem).select('text').attr('orgText');
		// var txtarea = d3.select('#paraTextEditor').select('textarea');
		// txtarea.style('height',d3.select('#paraText').node().getBoundingClientRect().height);
		// txtarea.node().value = params.paraTextSave;



	}

	//add circles with x's to delete boxes
	//writing as a function so that I can use it when I create new boxes
	function addDeleter(base){
		var r = Math.max(params.SDCBoxWidth/20., 8.);
		var deleter = base.append('g')
			.attr('class','SDCdeleter')
			.on('click', function(){
				//remove the node
				var orgText = params.cleanString(d3.select(this.parentNode).select('text').attr('orgText'));
				d3.select(this.parentNode).remove();

				//remove it from the selection words
				var index = -1;
				params.selectionWords.forEach(function(d, i){
					if (params.cleanString(d) == orgText) index = i;
				})
				if (index > -1) params.selectionWords.splice(index, 1);

				//remove it from the answers
				var answersGroup = params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
				delete answersGroup[orgText];

				//console.log('removing', orgText, index, params.selectionWords, params.answers)

				//reformat
				formatSDC();
			})

		deleter.append('circle')
				.attr('class','SDCdeleter')
				.attr('cx', '0px')
				.attr('cy', '0px')
				.attr('r', r + 'px')
				.style('fill', 'lightgray')
				.style('stroke', 'gray')

		deleter.append('text')
				.attr('class','SDCdeleter')
				.attr('x', '0px')
				.attr('y', '0px')
				.attr('text-anchor','middle')
				.attr('alignment-baseline','central')
				.style('font-size', (2.*r) + 'px')
				.style('line-height', (2.*r) + 'px')
				.style('fill','gray')
				.style('cursor','pointer')
				.text('X')
	}
	d3.selectAll('.SDCdeleter').remove();
	d3.select('#SDCPlotSVG').selectAll('.SDCrectContainer').each(function(){addDeleter(d3.select(this))})


	//add a button to create a new box
	adderNode = document.createElement('button');
	//var adder = d3.select('#systemDesignChart').select('.para').append('button')
	d3.select(adderNode)
		.attr('id','boxAdder')
		.attr('class','secondaryButton')
		.style('font-size',d3.select('#SDCDoneButton').style('font-size'))
		.text('+')
		.on('click', function(){
			//get a new name
			var num = 1;
			var text = 'new container '+num;
			var check = d3.select('#SDCBox_'+params.cleanString(text)).node();
			while (check){
				num += 1;
				text = 'new container '+num;
				check = d3.select('#SDCBox_'+params.cleanString(text)).node();
			}

			//create the box
			var bbox = d3.select('#systemDesignChartSVGContainer').node().getBoundingClientRect();
			var box = createSDCbox(0., 1.5*params.SDCBoxMargin, params.SDCBoxWidth, params.SDCInitBoxHeight, text);
			box.classed('blankRect', true);

			//add dragging
			dragHandler(box);

			//add the ability to edit text
			box.on('dblclick', editSDCtext);

			//add the deleter
			addDeleter(box);

			//recreate elems (to include this one)
			elems = populateElems();

			//add to selectionWords
			params.selectionWords.push(text);

			//add to answers
			var answersGroup = params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
			answersGroup[params.cleanString(text)] = null;
			var answersGroupOrg = params.answersOrg.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
			answersGroupOrg[params.cleanString(text)] = null;

		})
	insertAfter(adderNode, d3.select('#SDCVersionOptions').node())

	//resize the font of the adder button
	var bbox = adderNode.getBoundingClientRect();
	d3.select(adderNode).style('width', bbox.height + 'px')
		.style('height', bbox.height + 'px')
		.style('padding', 0 + 'px')
		.style('font-size',bbox.height + 'px')
		.style('line-height',bbox.height + 'px')
		.style('position','absolute')



}



function endSDCEdit(){
	console.log('done editing SDC');
	params.editingSDC = false;

	//change button to edit
	d3.select('#SDCEditButton').style('display','block');
	d3.select('#SDCDoneButton').style('display','none');

	//allow the user to make new responses and change the compile method, but not show any of the other options
	d3.select('#SDCVersionOptions').style('visibility','visible');
	d3.select('#SDCCompileOptions').style('visibility','visible');

	//allow the user to add lines
	d3.selectAll('.SDCrectContainer').on('mousedown', startSDCLine);

	//remove the availity to drag the rects
	params.SDCSVG.selectAll('.SDCrectContainer').on('mousedown.drag', null);

	//remove the ability to edit the text
	params.SDCSVG.selectAll('.SDCrectContainer').on('dblclick', null);

	//remove the circles
	d3.selectAll('.SDCdeleter').remove();

	//remove the adder button
	d3.select('#boxAdder').remove();

}

function useTextArea(){
	if (event.target.nodeName != 'TEXTAREA'){
		var changed = false;
		d3.selectAll('.SDCTextEditorInput').each(function(){
			var thisElem = this
			var parentElem = d3.select(d3.select(thisElem).attr('selector'));
			parentElem.attr('id','SDCBox_' + params.cleanString(thisElem.value))
			var text = parentElem.select('text')

			//save the original text
			var orgText = text.attr('orgText');

			//now reset things
			text
				.attr('orgText',thisElem.value)
				.text(thisElem.value)
				.call(wrapSVGtext, params.SDCBoxWidth-10);

			//fix any subcripts
			text.selectAll('tspan').each(function(){
				var t = d3.select(this).text();
				d3.select(this).html(params.applySubSuperStringSVG(t));
			})



			if (orgText != thisElem.value){
				changed = true;
				//console.log('changed')

				//update the selectionWords
				var index = -1;
				index = params.selectionWords.indexOf(orgText);
				if (index != -1) params.selectionWords[index] = thisElem.value;

				//update the answers
				if (params.cleanString(orgText) != params.cleanString(thisElem.value)){
					var answersGroup = params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
					var response = answersGroup[params.cleanString(orgText)];
					answersGroup[params.cleanString(thisElem.value)] = response;
					delete answersGroup[params.cleanString(orgText)];
				}
			}

			//remove the textarea
			d3.select(thisElem).remove();

			//set the color back
			parentElem.select('rect').classed('blankRect', false);
			var word = parentElem.attr('column');
			if (word){
				parentElem.select('rect').classed(word.toLowerCase()+'Word', true);
				parentElem.select('rect').classed(word.toLowerCase(), true);
			}
		})
		if (changed) formatSDC();
	}
}

function switchSDCCompiler(){

	if (this.value == 'answers'){
		console.log('building from answers');

		//show these (in case they are hidden)
		d3.select('#SDCVersionOptions').style('visibility','visible');
		d3.select('#SDCVersion1').style('visibility','visible');
		d3.select('#SDCVersion1label').style('visibility','visible');
		d3.select('#SDCVersion2').style('visibility','visible');
		d3.select('#SDCVersion2Label').style('visibility','visible');
		d3.select('#SDCAnswerToggle').style('visibility','visible');
		d3.select('#SDCAnswerToggleLabel').style('visibility','visible');

		//before resetting the answers check if there are any boxes that have null values in the original answers (these would have been added later)
		//if so, update to the current value in answers
		var answersGroupOrg = params.answersOrg.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
		var answersGroup = params.answers.filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
		Object.keys(answersGroupOrg).forEach(function(key){
			if (!answersGroupOrg[key]) answersGroupOrg[key] = answersGroup[key];
		})

		//reset the answers
		params.answers = [];
		params.answersOrg.forEach(function(d){params.answers.push(cloneObject(d));});


		//reset the SDC
		formatSDC(500);
		setTimeout(function(){
			plotSDCAggregateLines(true, 500);
			plotSDCAnswerLines(true, 500);
		}, 500)

	}
	if (this.value == 'consensus1' || this.value == 'consensus2'){
		var version = parseInt(this.value.substr(9));
		console.log('building from consensus version ', version);

		//similar to when you start editing, here you won't be able to show answers, versions, or responses
		//d3.select('#SDCVersionOptions').style('visibility','hidden'); //should I hide the entire thing, or do I want to allow user responses to be
		d3.select('#SDCVersion1').style('visibility','hidden');
		d3.select('#SDCVersion1label').style('visibility','hidden');
		d3.select('#SDCVersion2').style('visibility','hidden');
		d3.select('#SDCVersion2Label').style('visibility','hidden');
		d3.select('#SDCAnswerToggle').style('visibility','hidden');
		d3.select('#SDCAnswerToggleLabel').style('visibility','hidden');
		d3.selectAll('line').remove();
		d3.selectAll('circle').remove();
		d3.selectAll('.SDCAggregateFracBox').remove();

		//build the new answers (could just do this once and save the results in case the user toggles a lot)
		if (!params.answersConsensus) params.answersConsensus = {};
		if (!params.answersConsensus.hasOwnProperty(version)){

			//create the consensus answers (start from the true answers)
			params.answersConsensus[version] = [];
			params.answers.forEach(function(d){params.answersConsensus[version].push(cloneObject(d));});

			//now go through the answers and aggregated responses for this group
			var answersGroup = params.answersConsensus[version].filter(function(d){return (d.task == 'para' && d.groupname == params.groupname);})[0];
			Object.keys(answersGroup).forEach(function(key){
				if (key != 'groupname' && key != 'task'){
					//find the consensus response
					var topResult;
					var maxValue = 0;
					if (params.aggregatedParaResponses[version][key]){
						var agg = params.aggregatedParaResponses[version][key].num;
						Object.keys(agg).forEach(function(word, i){
							if (agg[word] > maxValue){
								maxValue = agg[word];
								topResult = word;
							}
							if (i == Object.keys(agg).length-1) answersGroup[key] = topResult;
						})
					} 

				}
			})

		}

		params.answers = [];
		params.answersConsensus[version].forEach(function(d){params.answers.push(cloneObject(d));});

		//reset the SDC
		formatSDC(500);


	}
}

function saveAsPPTX(){
	//https://gitbrent.github.io/PptxGenJS/docs/api-shapes.html

	console.log('saving as .pptx');

	function getLineOpts(elem){
		//it looks like lines are defined a bit strangely here using the w and h values (which must be positive)
		//So I will alwyas start with the left-most point, then I will flip vertically if necessary 
		var x1 =  parseFloat(elem.attr('x1'))/bbox.width*100.;
		var x2 =  parseFloat(elem.attr('x2'))/bbox.width*100.;
		var y1 =  (parseFloat(elem.attr('y1')) + topMargin)/bbox.height*100.;
		var y2 =  (parseFloat(elem.attr('y2')) + topMargin)/bbox.height*100.;

		if (x2 < x1){
			var x2tmp = x2;
			var y2tmp = y2;
			x2 = x1;
			y2 = y1;
			x1 = x2tmp;
			y1 = y2tmp;
		}

		var w = (x2 - x1);
		var h = (y2 - y1);

		var flipV = false;
		if (h < 0){
			h = Math.abs(h);
			y1 = y2;
			flipV = true;
		}

		var c = elem.attr('stroke');
		var sw = Math.round(parseFloat(elem.attr('stroke-width'))/2.); //not sure how to normalize
		var op = parseFloat(elem.style('opacity'))*parseFloat(elem.style('stroke-opacity'))*100;

		if (c.substr(0,3) == 'rgb'){
			var cc = c.substr(4, c.length - 5);
			var rgb = cc.split(',');
			var c = rgbToHex(parseFloat(rgb[0]), parseFloat(rgb[1]), parseFloat(rgb[2]));
		}
		
		var lineopts = {
			x: x1+'%',
			y: y1+'%',
			w: w+'%',
			h: h+'%',
			flipV: flipV,
			line: { color: c, width: sw,  transparency: (100. - op)},
		}

		if (elem.classed('SDCLine')){
			lineopts.lineHead = 'oval';
			lineopts.lineTail = 'oval';
		}

		return lineopts;
	}


	var pptx = new PptxGenJS();
	var slide = pptx.addSlide();

	//I will need to convert all my measurements to percentages
	var bbox = d3.select('#SDCPlotSVG').node().getBoundingClientRect()

	//get all the colors from the css file
	var colorWords = {}
	lowerArray(params.options.filter(function(d){return d != 'Select Category'})).forEach(function(d){
		colorWords[d] = getComputedStyle(document.body).getPropertyValue('--' + d + '-color');
	})


	//I need some margin at the top
	var topMargin = 20;

	//adding from back to front

	//add the column titles 
	d3.select('#SDCPlotContainer').selectAll('.SDCheader').each(function(){
		var elem = d3.select(this);
		var text = elem.text();
		var tbbox = this.getBoundingClientRect();
		var x = (parseFloat(elem.attr('x')) - params.SDCBoxWidth/2.)/bbox.width*100.;
		var y = (parseFloat(elem.attr('y')) + topMargin)/bbox.height*100.;

		var c = colorWords[this.classList[2].replace('Word','')]; //will this always be in the correct order?
		var fs = 10; //not sure what to set the font size to

		var italic = false;
		if (elem.style('font-style') == 'italic') italic = true;

		var underline = false;
		if (elem.style('text-decoration').indexOf('underline') >= 0) underline = true;

		slide.addText(text, {
			x: x+'%',
			y: y+'%',
			w: (params.SDCBoxWidth/bbox.width*100.)+'%',
			align: 'center',
			fontSize: fs,
			fontFace: 'Helvetica',
			color: c,
			bold: true,
			italic: italic,
			underline: underline,
		});
	})

	//add the answers and response lines lines that are visible
	d3.select('#SDCPlotContainer').selectAll('.SDCAnswerLine,.SDCAggregateLine').each(function(){
		var elem = d3.select(this);
		if (elem.style('opacity') > 0 && elem.style('stroke-opacity') > 0){
			slide.addShape(pptx.shapes.LINE, getLineOpts(elem)); 
		}
	})
	
	//add all the rects
	d3.select('#SDCPlotContainer').selectAll('.SDCrectContainer').each(function(){
		var elem = d3.select(this);
		var text = elem.select('text').attr('orgText');
		var x = parseFloat(elem.attr('x'))/bbox.width*100.;
		var y = (parseFloat(elem.attr('y')) + topMargin)/bbox.height*100.;
		var w = parseFloat(elem.select('rect').attr('width'))/bbox.width*100.;
		var h = parseFloat(elem.select('rect').attr('height'))/bbox.height*100.;
		var c = colorWords[this.classList[1]]; //will this always be in the correct order?
		var fs = 8; //not sure what to set the font size to

		//I may have to do something special to get the subscripts to show up... for now I will just remove the encoding
		//here is what the pptx xml coding looks like (rename to *.pptx.zip, extract, find files in ppt/slides/slide1.xml):
		// <a:p><a:r><a:rPr lang="en-US" dirty="0" err="1"/><a:t>begin</a:t></a:r>
		// <a:r><a:rPr lang="en-US" baseline="-25000" dirty="0" err="1"/><a:t>sub</a:t></a:r>
		// <a:r><a:rPr lang="en-US" baseline="30000" dirty="0" err="1"/><a:t>sup</a:t></a:r>
		// <a:r><a:rPr lang="en-US" dirty="0" err="1"/><a:t>end</a:t></a:r>
		slide.addText(params.removeSubSuperString(text), {
			shape: pptx.shapes.RECTANGLE,
			x: x+'%',
			y: y+'%',
			w: w+'%',
			h: h+'%',
			fill: { color:  c },
			line: { color: '#000000'},
			align: 'center',
			fontSize: fs,
			fontFace: 'Helvetica'
		});
	})

	//add the user response lines on top
	d3.select('#SDCPlotContainer').selectAll('.SDCLine').each(function(){
		var elem = d3.select(this);
		if (elem.style('opacity') > 0 && elem.style('stroke-opacity') > 0){
			slide.addShape(pptx.shapes.LINE, getLineOpts(elem)); 
		}
	})
	
	pptx.writeFile({ fileName: "SystemDesignChart.pptx" });
}