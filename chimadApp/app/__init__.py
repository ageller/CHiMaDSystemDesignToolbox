from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from threading import Lock

import pandas as pd
import os
from datetime import datetime

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
	data = message['data']
	filename = os.path.abspath('static/data/' + data['SHEET_NAME'] + '.csv')
	print('!!! filename', filename)

	if (os.path.exists(filename)):
		# if this is an existing file, then read it in and see if we have the username already
		print('!!! have file')
		df = pd.read_csv(filename)

		# if the sheet name is 'paragraphs', then we search for the groupname; otherwise we search for the username
		iRow = []
		if (data['SHEET_NAME'] == 'paragraphs'):
			key = 'groupname'
			iRow = df.index[ df[key] == data[key] ].tolist()
		else:
			key = 'username'
			iRow = df.index[ (df[key] == data[key]) & (df['task'] == data['task']) ].tolist()


		#if the key is groupname, we only expect to find one of these
		#if the key is username, we may have two
		# - if we have 1 then we append a new row for the 2nd version
		# - if we have 2 then we use the second version
		version = 1
		if (key == 'username'):
			if (len(iRow) == 1):
				iRow = []
				version = 2
			if (len(iRow) == 2):
				iRow = [iRow[1]]
				version = 2

		print('!!! checking ', key, iRow, version)

		#populate a new row DataFrame
		d = dict()
		for h in df.columns.tolist():
			if (h in data):
				d[h] = data[h]
			if (h == 'Timestamp'):
				d[h] = datetime.now().strftime('%m/%d/%Y %H:%M:%S')
			if (h == 'version'):
				d[h] = version
			if (h not in data and h != 'Timestamp' and h != 'version'):
				d[h] = ''

		df2 = pd.Series(d) #this might not be necessary

		if (len(iRow) == 1):
			#this is an existing row that needs to be updated
			for h in df.columns.tolist():
				df.loc[iRow[0], h] = df2[h]

		else:
			#this is a new row
			df = df.append(df2, ignore_index=True)


	else:
		# if this is a new paragraph then we will need to create a file (from editPara)
		print('!!! creating new file')
		df = pd.DataFrame()
		if ('header' in data):
			d = dict()
			for h in data['header']:
				d[h] = []
			df = pd.DataFrame(d)

	#now write the file (will replace the current file)
	print(df)
	df.fillna('').to_csv(filename, index=False)

	message['error'] = False
	emit('responses_saved',message, namespace=namespace)


@app.route("/test")
def test():
	return render_template("index.html")

@app.route("/")
def training():
	return render_template("training.html")

@app.route("/editPara")
def editPara():
	return render_template("editPara.html")

@app.route("/editSDC")
def editSDC():
	return render_template("editSDC.html")

# comment this part out when adding it to the production server
if __name__ == "__main__":
	socketio.run(app, host='0.0.0.0', port=5000, use_reloader=True)