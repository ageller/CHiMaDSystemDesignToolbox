//all "global" variables are contained within params object
  
var params;
defineParams();
function defineParams(){
	params = new function() {

		this.mouseDown = false;

		this.userIP = "00.000.00.00";
		this.uername = "";

		//options for the dropdown menu
		this.options = ['Select Category','Processing','Structure','Property','Performance'];

		//this defines the colormap
		this.colorMap = d3.scaleLinear().domain([0,1]).interpolate(d3.interpolateHcl).range([d3.rgb("#E0E0E0"), d3.rgb('#2C78CA')]);

		//check to make sure we're ready to create the plots
		this.haveParagraphData = false;
		this.haveSurveyData = false;
		this.haveAnswersData = false;

		this.groupname = 'polymercompositeexample';
		this.groupnameOrg = 'Polymer Composite Example';
		this.surveyFile = 'static/data/'+this.groupname+'.csv';
		this.paragraphFile = 'static/data/paragraphs.csv';

		//use this to get the available sheets
		this.availableGroupnames = []; //this will hold the available sheets

		//will save the initial input text before adding dropdown tags
		this.paraTextSave = '';
		
		//will hold the paragraphs that are saved in the google sheet
		this.paragraphs;

		//a check to see if the groupname was switche
		this.switchedGroupname = false;

		//this will hold the responses downloaded from the google sheet
		this.responses;
		this.aggregatedParaResponses = []; //will have multiple versions
		this.paraResponseVersion = 1;
		this.dummyData = {};
		this.paraSubmitted = false; //will be changed to true after form is submitted 
		this.paraSubmitted2 = false; //will be changed to true after form is submitted a second time
		this.showingResults = false; //will be changed to true after form is submitted and results are shown
		this.wavingBars = false; //will be changed to true after the plot is defined
		this.toggleParaText = true; //controls whether to toggle text in para.  Will be true at first and then when version is changed 
		this.transitionParaAnswers = true; //controls whether to use transition for answers.  Will be true at first.

		//this will hold the answers from the static data file
		this.answers = [{'groupname':this.groupname, 'task':'para'},
						{'groupname':this.groupname, 'task':'SDC'}];
		//this will just be a copy of the answers, since in some cases I will want to change the answers and revert back
		this.anwersOrg =  [{'groupname':this.groupname, 'task':'para'},
						{'groupname':this.groupname, 'task':'SDC'}];

		this.answersGroupnames = {'para':[],'SDC':[]};
		this.showParaAnswers = true; //can be toggled with checkbox
		this.showSDCAnswers = true; //can be toggled with checkbox
		this.showSDCAggregate = true; //can be toggled with checkbox

		//this will hold the selection words (and is filled within populateBoxes)
		this.selectionWords = [];

		//will be filled in after the user clicks submit
		this.paraData = {};

		//if the url contains form data, this will store it
		this.URLInputValues = {};

		//holds the svg element
		this.boxGridSVG;
		this.boxGridxScale;
		this.boxGridyScale;
		this.boxGridSVGMargin;
		this.boxGridSVGHeight;
		this.boxGridSVGHistHeight;
		this.boxGridSVGWidth;

		//will be set to true if initBars.js is included and will enable drawing of the bar charts
		this.haveBars = false;
		this.createdBars = false;

		//will hold the default bar opacity
		this.barOpacity = 1;

		//wave the bars in this interval
		this.waveInterval;
		this.waveTimeouts = [];
		this.waveWait;

		//interval for reloading data
		this.loadInterval;
		this.loadIntervalDuration = 30*1000; //30 seconds, in units of milliseconds

		//transitions used for changing the bar heights
		this.transitionDuration = 500;
		this.transitionWaveDuration = 5000;
		this.transitionSDCDuration = 200;

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
		this.barHeight = 30; //px, minimum height of each row in the plot

		//will be set to true if initSystemDesignChart.js is included and will enable drawing of the SDC
		this.haveSDC = false;

		//settings for the system design chart (SDC)
		this.SDCColumnCenters; //will hold the central x locations for the columns
		this.SDCColumnYTops = {}; //will hold the top y locations of each column 
		this.SDCSVG = null;
		this.SDCAggSVG = null;
		this.SDCAnswersSVG = null;
		this.SDCSVGMargin;
		this.SDCSVGHeight;
		this.SDCSVGWidth;
		this.SDCBoxMargin = 20;
		this.SDCBoxWidth;
		this.SDCInitBoxHeight = 40; 

		this.SDCLine = null;
		this.SDCCircle0 = null;
		this.SDCCircle = null;
		this.SDCData = {}; //will hold all the data from the SDC
		this.SDCLineIndex = 0;
		this.SDCLineHighlighted = false;
		this.aggregatedSDCResponses = []; //will have multiple version
		this.SDCSubmitted = false;
		this.maxSDCLineWidth = 20;
		this.minSDCLineWidth = 5;
		this.SDCResponseVersion = 1;
		this.showSDCResponses = true;
		this.firstSDCplot = true; //will be set to false after the first plotting.  This will allow an initial animation, but not during the regular re-read+re-draw cycle.

//this defines the minimum percentage of answers that is acceptable (otherwise the label is emphasized as something to discuss)
		this.pctLim = 0.8;

		//will hold mouse events
		this.event = {'keyCode':null,'clientX':0, 'clientY':0};

        // //flask + socketio
        // // Use a "/test" namespace.
        // // An application can open a connection on multiple namespaces, and
        // // Socket.IO will multiplex all those connections on a single
        // // physical channel. If you don't care about multiple channels, you
        // // can set the namespace to an empty string.
        // this.namespace = '/CHiMaD';
        // // Connect to the Socket.IO server.
        // // The connection URL has the following format:
        // //     http[s]://<domain>:<port>[/<namespace>]
        // this.socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + this.namespace);//, {
        // //  'reconnectionDelay': 10000,
        // //  'reconnectionDelayMax': 20000,
        // // });

		this.cleanString = function(s){
			return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
		}
		this.applySubSuperStringSVG = function(s){
			return s.replaceAll('_{','<tspan dy="5px">').replaceAll('}_','</tspan><tspan dy="-5px">').replaceAll('^{','<tspan dy="-5px">').replaceAll('}^','</tspan><tspan dy="5px">');
		}
		this.applySubSuperStringHTML = function(s){
			return s.replaceAll('_{','<sub>').replaceAll('}_','</sub>').replaceAll('^{','<sup>').replaceAll('}^','</sup>');
		}
		this.revertSubSuperString = function(s){
			return s.replaceAll('<tspan dy="5px">','_{').replaceAll('</tspan><tspan dy="-5px">','}_').replaceAll('<tspan dy="-5px">','^{').replaceAll('</tspan><tspan dy="5px">','}^').replaceAll('<sub>','_{').replaceAll('</sub>','}_').replaceAll('<sup>','^{').replaceAll('</sup>','}^');
			//return s.replaceAll('<tspan dy="5px">','').replaceAll('<tspan dy="-5px">','').replaceAll('<tspan>','').replaceAll('</tspan>','').replaceAll('<sub>','').replaceAll('</sub>','').replaceAll('<sup>','').replaceAll('</sup>','');
		}
		this.removeSubSuperString = function(s){
			return s.replaceAll('_{','').replaceAll('}_','').replaceAll('^{','').replaceAll('}^','');
		}

		this.isMobile = false; //initiate as false

		this.haveParaEditor = false; //will be true if the paragraph editor is active
		this.haveSDCEditor = false; //will be true if the SDC editor is active
		this.editingSDC = false; //will be true if user is currently editting SDC
		this.edittedSDC = false; //will be true if user is has editted SDC (so that we don't show the aggregate lines of answers)
		this.edittingPara = false; //will be true when user is editing paragraph
		
		this.triedLoadingAgain = false;

	};

	//check for mobile
	//https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device

	// device detection
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
		params.isMobile = true;
	}
}