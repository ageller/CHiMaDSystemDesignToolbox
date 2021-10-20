from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from threading import Lock

import pandas as pd

# Set this variable to "threading", "eventlet" ,"gevent" or "gevent_uwsgi" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = "eventlet" #"eventlet" is WAY better than "threading"

app = Flask(__name__)
app.config['SECRET_KEY'] = 'CHiMaD!App3_'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()

namespace = '/CHiMaD'
#testing the connection
@socketio.on('connection_test', namespace=namespace)
def connection_test(message):
	print('======= connection_test', message)
	emit('connection_response',{'data': message['data']}, namespace=namespace)


#the background task can run in a while loop if needed
@socketio.on('connect', namespace=namespace)
def connect(message):
	global thread
	print('======= Initial connection', message)
	# with thread_lock:
	# 	if thread is None:
	# 		thread = socketio.start_background_task(target=background_thread)
			
#I am going to start by simply downloading the Google sheets as csv files and working with those
#once I have that working, I will transition to using a SQL database

#read in a csv file
@socketio.on('load_file', namespace=namespace)
def load_file(message):
	print('======= load_file', message)
	df = pd.read_csv(message['filename'])
	emit(message['callback'],{'data': df.fillna('').to_json(orient='records'), 'columns':df.columns.tolist()}, namespace=namespace)

@socketio.on('save_responses', namespace=namespace)
def save_responses(message):
	print('======= save_responses', message)
	# I will need to perform all the checks that I had in the google script but now in python
	# For now, I will save the values to a csv file

	message['error'] = False
	emit('responses_saved',message, namespace=namespace)


@app.route("/test")
def test():
	return render_template("index.html")

@app.route("/")
def training():
	return render_template("training.html")

# comment this part out when adding it to the production server
if __name__ == "__main__":
	socketio.run(app, host='0.0.0.0', port=5000, use_reloader=True)