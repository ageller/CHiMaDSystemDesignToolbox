function createDropdowns(){
//create all the dropdowns for the selection words (and prefill based on the URL)

	d3.selectAll('.selectionWord')
		.on('click',function(){
				var elem = d3.select(this).select('select')
				if (elem.classed('hidden')){
					elem.style('left', event.pageX)
					elem.style('top', event.pageY+20)
				}
				d3.selectAll('.selectionWordDropdown').classed('hidden', true);
				elem.classed('hidden', !elem.classed('hidden'));
				if (params.isMobile){
					elem.classed('hidden', false)
				}
		})
	.append('select')
		.attr('id',function(){
			return params.cleanString(d3.select(this.parentNode).select('text').node().innerHTML);})
		.on('change',function(){
			var parent = this.parentNode;
			d3.select(this).selectAll('option').each(function(dd, j){
				if (this.selected && !this.disabled){
					d3.select(parent).attr('class','selectionWord '+this.value.toLowerCase()+'Word');
					var key = params.cleanString(d3.select(parent).select('text').node().innerHTML);
					params.URLinputValues[key] = this.value;
					appendURLdata();
				}
			})
		})
		.attr('class','selectionWordDropdown hidden')
		//.classed('hidden', true)
		.style('z-index',9)
		.style('position','absolute')
		.attr('size', 5)
		.selectAll('option').data(params.options).enter()
		.append('option')
			.attr('id',function(d,i){
				if (i > 0) {
					return d;
				}
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

	useURLdata();
}

function useURLdata(){
	//apply the form data from the URL
	var keys = Object.keys(params.URLinputValues);
	keys.forEach(function(k){
		console.log('using', k, params.URLinputValues[k])
		if (k == "username"){
			params.username = params.URLinputValues[k];
			d3.select('#username').attr('value',params.username);
		} else {
			d3.select(d3.select('#'+k).node().parentNode).attr('class','selectionWord '+params.URLinputValues[k].toLowerCase()+'Word');
			d3.select('#'+k).select('#'+params.URLinputValues[k]).property("selected",true);
		}

	})
}