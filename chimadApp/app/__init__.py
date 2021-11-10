from flask import Flask, jsonify, request, render_template
import pandas as pd
import os
import sys
from datetime import datetime


#https://github.com/smoqadam/PyFladesk/issues/9
# PyInstaller creates a temp folder and stores path in _MEIPASS
current_location = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))

template_dir = os.path.join(current_location, 'templates')
static_dir = os.path.join(current_location, 'static')
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.config.update(
	TEMPLATES_AUTO_RELOAD=True
)
#app.config['SECRET_KEY'] = 'CHiMaD!App3_'

#I need to set this to true in my gui.py file
inDesktopApp = False
def setInDesktopApp():
	global inDesktopApp
	print('======= setting to desktop version')
	inDesktopApp = True

#I am going to start by simply downloading the Google sheets as csv files and working with those
#once I have that working, I will transition to using a SQL database

@app.route('/load_file', methods=['GET', 'POST'])
def load_file():
	message = request.get_json()
	filename = os.path.join(current_location, message['filename'])
	print('======= load_file', current_location, message['filename'], filename)

	df = pd.read_csv(filename)
	out = {'data': df.fillna('').to_json(orient='records'), 'columns':df.columns.tolist()}
	return jsonify(out)

@app.route('/save_responses', methods=['GET', 'POST'])
def save_responses():
	message = request.get_json()
	print('======= save_responses', message)

	# I will need to perform all the checks that I had in the google script but now in python
	# For now, I will save the values to a csv file
	data = message['data']
	filename = os.path.join(current_location, 'static/data/' + data['SHEET_NAME'] + '.csv')
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

		#print('!!! checking ', key, iRow, version)

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

	return jsonify(message)



@app.route('/')
def default():
	return render_template('index.html', inDesktopApp=inDesktopApp)

@app.route('/home')
def home():
	return render_template('index.html', inDesktopApp=inDesktopApp)

@app.route('/index')
def index():
	return render_template('index.html', inDesktopApp=inDesktopApp)

@app.route('/training')
def training():
	return render_template('training.html', inDesktopApp=inDesktopApp)

@app.route('/editPara')
def editPara():
	return render_template('editPara.html', inDesktopApp=inDesktopApp)

@app.route('/editSDC')
def editSDC():
	return render_template('editSDC.html', inDesktopApp=inDesktopApp)

@app.route('/about')
def about():
	return render_template('about.html', inDesktopApp=inDesktopApp)

# comment this part out when adding it to the production server
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000, use_reloader=True)