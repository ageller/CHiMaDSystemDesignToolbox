//all "global" variables are contained within params object
  
var params;
function defineParams(){
    params = new function() {
    	this.userIP = "";
    	this.uername = "";

    	this.googleAPIurl = "https://script.google.com/macros/s/AKfycbys9IdddyCwbLq5pcb44-L8dkvH0vMWM2PYdyGpVe2CwnHrjoabNhNS/exec";

		//will be filled in after the user clicks submit
		this.paraData = {};

		//if the url contains form data, this will store it
		this.URLinputValues = {};

		//will store the number of trials for submitting
		this.nTrials = 0;

		//maximum number of trials allows for submitting
		this.maxTrials = 5;

		this.cleanString = function(s){
			return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z ]/g, "").toLowerCase();


		}
	};
}