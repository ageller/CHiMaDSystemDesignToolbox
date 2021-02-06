//all "global" variables are contained within params object
  
var params;
function defineParams(){
    params = new function() {
    	this.userIP = "";
    	this.uername = "";

    	//options for the dropdown menu
		this.options = ['Select Category','Processing','Structure','Property','Performance'];

		//this defines the colormap
		this.colorMap = d3.scaleLinear().domain([0,1]).interpolate(d3.interpolateHcl).range([d3.rgb("#E0E0E0"), d3.rgb('#2C78CA')]);

    	//script that will control entries into the google sheet
    	this.googleAPIurl = "https://script.google.com/macros/s/AKfycbys9IdddyCwbLq5pcb44-L8dkvH0vMWM2PYdyGpVe2CwnHrjoabNhNS/exec";

//the URL of the json getter of the sheet, for the visualization of results
//in order to get this URL:
// 1. make the sheet public to the web (File / Publish to Web /)
// -- good walk through here: https://github.com/bpk68/g-sheets-api#readme
// 2. use the URL from the share feature to get the ID (between the /d/ and next / in the URL)
// -- here : https://docs.google.com/spreadsheets/d/1wqex6pmdf8CobXEORdC8S5EN7N70EACVaGAp34SmB2Q/edit?usp=sharing
// 3. input that <SHEET_ID> into the following command : https://spreadsheets.google.com/feeds/cells/<SHEET_ID>/1/public/values?alt=json-in-script
		this.surveyFile = 'https://spreadsheets.google.com/feeds/cells/1wqex6pmdf8CobXEORdC8S5EN7N70EACVaGAp34SmB2Q/1/public/values?alt=json-in-script&callback=readGoogleSheet'

		//this will hold the responses downloaded from the google sheet
		this.responses;
		this.aggregatedResponses = []; //will have multiple versions
		this.responseVersion = 1;
		this.dummyData = {};
		this.showingResults = false; //will be changed to true after form is submitted and results are shown
		this.wavingBars = false; //will be changed to true after the plot is defined
		this.firstDisplay = true; //controls whether to blink the text in the vis.  Will be true at first and then when version is changed 

		//this will hold the answers from the static data file
		this.answers;

		//this will hold the selection words (and is filled within populateBoxes)
		this.selectionWords = [];

		//will be filled in after the user clicks submit
		this.paraData = {};

		//if the url contains form data, this will store it
		this.URLinputValues = {};

		//will store the number of trials for submitting
		this.nTrials = 0;

		//maximum number of trials allows for submitting
		this.maxTrials = 5;

		//holds the svg element
		this.svg;
		this.xScale;
		this.yScale;
		this.svgMargin;
		this.svgHeight;
		this.svgHistHeight;
		this.svgWidth;

		//will hold the default bar opacity
		this.barOpacity = 1;

		//wave the bars in this interval
		this.waveInterval;
		this.waveTimeouts = [];

		//interval for reloading data
		this.loadInterval;
		this.loadIntervalDuration = 30*1000; //30 seconds, in units of milliseconds

		//transitions used for changing the bar heights
		this.transitionDuration = 500;
		this.transitionWaveDuration = 5000;

		//minimum sizes for fonts and bounding boxes
		this.paraFSmin = 16;  //0.01
		this.buttonFSmin = 14; //0.009
		this.instructionsFSmin = 12; //0.008
		this.versionFSmin = 10; //0.007
		this.maxPlotFont = 20;
		this.minPlotFont = 10;
		this.plotFraction = 0.4; //fraction of the page that will contain the plot if this is in side-by-side view
		this.minPlotWidth = 1920*this.plotFraction/2.; //px, minimum width of the plot
		this.minParaWidth = 1920*(1 - this.plotFraction)/2.; //px, minimum width of the paragraph
		this.minBarHeight = 30; //px, minimum height of each row in the plot

//this defines the minimum percentage of answers that is acceptable (otherwise the label is emphasized as something to discuss)
		this.pctLim = 0.8;

		this.cleanString = function(s){
			return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z ]/g, "").toLowerCase();
		}


	};
}