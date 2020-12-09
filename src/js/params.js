//all "global" variables are contained within params object
  
var params;
function defineParams(){
    params = new function() {
    	this.userIP = "";

    	this.googleAPIurl = "https://script.google.com/macros/s/AKfycbxexmKuZcrUv2YzbhwsyFRnb5dh_Y3PKE6SEKWWJGoGEUeIOac/exec";

		this.paraData = {};

		this.cleanString = function(s){
			return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z ]/g, "").toLowerCase();


		}
	};
}