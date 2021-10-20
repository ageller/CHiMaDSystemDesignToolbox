/////////////////////
//// for sockets
/////////////////////
//https://blog.miguelgrinberg.com/post/easy-websockets-with-flask-and-gevent
//https://github.com/miguelgrinberg/Flask-SocketIO
function connectSocket(){
	//$(document).ready(function() {
	document.addEventListener("DOMContentLoaded", function(event) {
		// Event handler for new connections.
		// The callback function is invoked when a connection with the
		// server is established.
		params.socket.on('connect', function() {
			params.socket.emit('connection_test', {data: 'Connected!'});
		});
		params.socket.on('connection_response', function(d) {
			console.log('connection response', d);
		});

		//response after load_data
		params.socket.on('compileParagraphData', function(d){
			var data = JSON.parse(d.data);
			data.columns = d.columns;
			compileParagraphData(data);
		})
		params.socket.on('aggregateResults', function(d){
			var data = JSON.parse(d.data);
			data.columns = d.columns;
			aggregateResults(data);
		})

		//respone after save_data
		params.socket.on('responses_saved', function(d){
			console.log('responses_saved', d);

			var resp = d.successResponse;
			if (d.error) resp = d.failResponse; //currently this is not possible, since I am simply setting error to False in python

			if (d.notificationID){
			d3.select('#'+d.notificationID)
				.classed('blink_me', false)
				.classed('error', d.error)
				.text(resp);
			}

			//show the aggregated responses (now showing after reading in the data within aggregateParaResults)
			if (d.startInterval && !d.error) {
				loadFile(params.surveyFile, 'aggregateResults');

				clearInterval(params.loadInterval);
				params.loadInterval = setInterval(function(){
					loadFile(params.surveyFile, 'aggregateResults');
				}, params.loadIntervalDuration);
			}

			resize();

		})
	});
}