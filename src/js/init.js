function createDropdowns(){

	var options = ['Select Category','Processing','Structure','Properties','Performance'];
	d3.selectAll('.selectionWord').append('select')
		.attr('id',function(){
			//console.log(params.cleanString(d3.select(this.parentNode).select('text').node().innerHTML));
			return params.cleanString(d3.select(this.parentNode).select('text').node().innerHTML);})
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