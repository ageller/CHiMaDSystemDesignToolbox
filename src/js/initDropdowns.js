function updatePara(newTxt = null){
	//update the paragraph text
	var newText = '';
	if (newTxt) {
		newText = newTxt
	} else {
		if (params.paragraphs.hasOwnProperty(params.cleanString(params.groupname))) newText = params.paragraphs[params.cleanString(params.groupname)].paragraph;
	}
	console.log('have new text:',params.groupname, newText);
	d3.select('#paraText').html(newText);
	convertPara();

}

function convertPara(){
	//take the input paragraph with tagged words and convert those tags to html markup

	//first save the initial text
	params.paraTextSave = d3.select('#paraText').html().trim();
	//now modify the paragraph to 
	// - change the '[[' to <span class="selectionWord"><text>
	// - change the ']]' to </text></span>
	var useText = params.applySubSuperStringHTML(params.paraTextSave.replaceAll('[[','<span class="selectionWord"><text>').replaceAll(']]','</text></span>'))
	d3.select('#paraText').html(useText);	
}

function getSelectionWords(){
	//get all the words for selecting

	params.selectionWords = [];
	d3.selectAll('.selectionWord').select('text').each(function(d){
		params.selectionWords.push(params.revertSubSuperString(this.innerHTML));
	})
}

function createDropdowns(){
//create all the dropdowns for the selection words (and prefill based on the URL)

	d3.selectAll('.selectionWord')
		.on('click',function(){
			var elem = d3.select(this).select('select')
			//console.log('clicked on', this, elem.node(), event.target)
			// if (elem.classed('hidden')){
			// 	elem.style('left', event.pageX);
			// 	elem.style('top', event.pageY+20);
			// }
			d3.selectAll('.selectionWordDropdown').classed('hidden', true);
			elem.classed('hidden', !elem.classed('hidden'));
			elem.node().focus();
			
			if (params.isMobile){
				elem.classed('hidden', false);
			}
		})
		.append('select')
			.attr('id',function(){
				return params.cleanString(params.revertSubSuperString(d3.select(this.parentNode).select('text').node().innerHTML));})
			.on('change',function(){
				var parent = this.parentNode;
				d3.select(this).selectAll('option').each(function(dd, j){
					if (this.selected && !this.disabled){
						var wrong = d3.select(parent).classed('wrongBorder');
						d3.select(parent).attr('class','selectionWord '+this.value.toLowerCase()+'Word');
						d3.select(parent).classed('wrongBorder', wrong);
						var key = params.cleanString(params.revertSubSuperString(d3.select(parent).select('text').node().innerHTML));
						params.URLInputValues[key] = this.value;
						appendURLdata();
						if (params.haveParaEditor){
							if (!params.answersGroupnames['para'].includes(params.cleanString(params.groupname))) params.answersGroupnames['parap'].push(params.cleanString(params.groupname));
							params.answers.forEach(function(a){
								if (params.cleanString(a.groupname) == params.cleanString(params.groupname) && a.task == 'para') a[key] = params.cleanString(params.URLInputValues[key]);
							})
							if (params.haveSDC) formatSDC();
						}
					}
				})
			})
			.on('keyup', function(){
				//enter
				if (event.keyCode == 13) d3.select(this).classed('hidden', true); 
				//right arrow
				if (event.keyCode == 39) eventFire(getNextSibling(this.parentNode, '.selectionWord'), 'click');
				//left arrow
				if (event.keyCode == 37) eventFire(getPrevSibling(this.parentNode, '.selectionWord'), 'click');
			})
			.attr('class','selectionWordDropdown hidden')
			//.classed('hidden', true)
			.style('z-index',9)
			.style('position','absolute')
			.style('margin-left','7px')
			.attr('size', 5) //this also changes the entire look of the dropdowns and makes it so that one cannot use arrows
			.selectAll('option').data(params.options).enter()
			.append('option')
				.attr('id',function(d,i){
					if (i > 0) {
						return d;
					}
					return 'disabled'
				})
				.property('value',function(d,i){
					if (i > 0) {
						return d;
					}
				})
				.property("selected", function(d,i){
					if (i == 0) {
						return true;
					}
					return false
				})
				.property("disabled", function(d,i){
					if (i == 0) {
						return true;
					}
					return false
				})
				.text(function(d){return d;})

	useParaURLdata();
}

function useParaURLdata(){
	//apply the form data from the URL
	var keys = Object.keys(params.URLInputValues);
	d3.selectAll('.selectionWord').attr('class','selectionWord'); //remove all the colors
	keys.forEach(function(k){
		if (k == "username"){
			params.username = params.URLInputValues[k];
			d3.select('#usernameInput').attr('value',params.username);
		} else {
			if (k.substring(0,3) != 'SDC'){
				//console.log('using', k, params.URLInputValues[k])
				var elem = d3.select('#'+k)
				if (elem.node()){
					d3.select(elem.node().parentNode).attr('class','selectionWord '+params.URLInputValues[k].toLowerCase()+'Word');
					elem.select('#'+params.URLInputValues[k]).property("selected",true);
				}
			}
		}

	})
}