function createDropdowns(){

	var options = ['Select Category','Processing','Structure','Properties','Performance'];
	d3.selectAll('.selectionWord')
		.on('click',function(){
			var hidden = d3.select(this).select('select').classed('hidden');
			d3.select(this).select('select').classed('hidden', !hidden);
		})
	.append('select')
		.attr('id',function(){
			//console.log(params.cleanString(d3.select(this.parentNode).select('text').node().innerHTML));
			return params.cleanString(d3.select(this.parentNode).select('text').node().innerHTML);})
		.on('change',function(){
			var parent = this.parentNode;
			d3.select(this).selectAll('option').each(function(dd, j){
				if (this.selected && !this.disabled){
					d3.select(parent).classed(this.value.toLowerCase()+'Word',true)
				}
			})
		})
		.classed('hidden', true)
		.attr('size', 5)
		.selectAll('option').data(options).enter()
		.append('option')
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

}

defineParams();
createDropdowns();