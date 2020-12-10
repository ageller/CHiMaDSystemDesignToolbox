d3.select('body').on('click',function(){
	if (!event.target.parentNode.classList.contains('selectionWord')){ 
		d3.selectAll('select').classed('hidden', true);
	}
})

function createDropdowns(){

	var options = ['Select Category','Processing','Structure','Properties','Performance'];
	d3.selectAll('.selectionWord')
		.on('click',function(){
			var elem = d3.select(this).select('select')
			elem.style('left', event.pageX)
			elem.style('top', event.pageY+20)
			elem.classed('hidden', !elem.classed('hidden'));
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
		.classed('hidden', true)
		.attr('size', 5)
		.selectAll('option').data(options).enter()
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

function readURLdata(){
	//read form data from the URL, if present
	window.location.href.split("?").forEach(function(d){
		if (d.includes('=')){
			val = d.split('=');
			params.URLinputValues[val[0]] = val[1];
		}
	});
	console.log('URL input values ', params.URLinputValues)
}

function appendURLdata(){
	//append new form data to the URL
	var newURL = window.location.href.split("?")[0];
	var keys = Object.keys(params.URLinputValues);
	keys.forEach(function(k,i){
		newURL += '?'+k+'='+params.URLinputValues[k];
		if (i == keys.length - 1){
			window.location.href = newURL
		}
	});
}

function useURLdata(){
	//apply the form data from the URL
	var keys = Object.keys(params.URLinputValues);
	keys.forEach(function(k){
		console.log('using', k, params.URLinputValues[k])
		d3.select(d3.select('#'+k).node().parentNode).attr('class','selectionWord '+params.URLinputValues[k].toLowerCase()+'Word')
		d3.select('#'+k).select('#'+params.URLinputValues[k]).property("selected",true)

	})
}

defineParams();
readURLdata();
createDropdowns();