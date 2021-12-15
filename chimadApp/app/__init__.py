from flask import Flask, jsonify, request, render_template, send_file, make_response
import pandas as pd
import os
import re
import sys
from datetime import datetime
import pytz

import sqlite3


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

# store whether a user submitted a response
userSubmitted = dict()


#I need to set this to true in my gui.py file
inDesktopApp = False
def setInDesktopApp():
	global inDesktopApp
	print('======= setting to desktop version')
	inDesktopApp = True

# using sqlite3 database
@app.route('/load_table', methods=['GET', 'POST'])
def load_table():
	message = request.get_json()
	tablename = message['tablename']
	dbname = message['dbname']
	print('======= load_table', message, tablename)

	# connect to the SQL database and load the table
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute('SELECT * FROM ' + tablename)
	columns = [description[0] for description in cursor.description]
	df = pd.DataFrame(cursor.fetchall(), columns = columns)    
	cursor.close()

	out = {'data': df.fillna('').to_json(orient='records'), 'columns':df.columns.tolist()}
	return jsonify(out)


@app.route('/save_responses', methods=['GET', 'POST'])
def save_responses():
	global userSubmitted

	message = request.get_json()
	print('======= save_responses', message)

	# I will need to perform all the checks that I had in the google script but now in python
	# since I started with csv files read in by pandas, I will just convert this code to work with pandas (rather than doing the searching in sqlite3)
	data = message['data']

	# connect to the SQL database and check if the table exists
	groupname = message['groupname']
	dbname = message['dbname']
	tablename = message['tablename']
	print('!!! groupname, dbname, tablename', groupname, dbname, tablename)

	# set the userSubmitted flag
	if (groupname not in userSubmitted):
		userSubmitted[groupname] = dict()
	if (dbname not in userSubmitted[groupname]):
		userSubmitted[groupname][dbname] = dict()
	if (tablename not in userSubmitted[groupname][dbname]):
		userSubmitted[groupname][dbname][tablename] = dict()
	userSubmitted[groupname][dbname][tablename] = True

	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
	tables = [x[0] for x in cursor.fetchall()]

	if (tablename in tables):
		# if this is an existing table, then read it in and see if we have the username already
		print('!!! have table')
		cursor.execute('SELECT * FROM ' + tablename)
		columns = [description[0] for description in cursor.description]
		df = pd.DataFrame(cursor.fetchall(), columns = columns)   

		# if the sheet name is 'paragraphs', then we search for the paragraphname; otherwise we search for the username
		iRow = []
		if (tablename == 'paragraphs'):
			key = 'paragraphname'
			iRow = df.index[ df[key] == data[key] ].tolist()
		else:
			key = 'username'
			iRow = df.index[ (df[key] == data[key]) & (df['task'] == data['task']) ].tolist()


		#if the key is paragraphname, we only expect to find one of these
		#if the key is username, we may have two
		# - if we have 1 then we append a new row for the 2nd version
		# - if we have 2 then we use the second version
		version = 1
		if (key == 'username'):
			print('!!!!!!checking', iRow)
			if (len(iRow) == 1):
				iRow = []
				version = 2
			if (len(iRow) >= 2):
				iRow = [iRow[1]]
				version = 2

			# not limitting to version 1 and 2.  keep all responses
			# version = len(iRow) + 1
			# iRow = []

		#print('!!! checking ', key, iRow, version)

		#populate a new row DataFrame
		d = dict()
		for h in df.columns.tolist():
			if (h in data):
				d[h] = data[h]
			if (h == 'Timestamp'):
				CT = pytz.timezone('America/Chicago')
				d[h] = datetime.now(CT).strftime('%m/%d/%Y %H:%M:%S')
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
		# if this is a new paragraph then we will need to create a new table (from editPara)
		print('!!! creating new table')
		df = pd.DataFrame()
		if ('header' in data):
			d = dict()
			for h in data['header']:
				d[h] = []
			df = pd.DataFrame(d)

	#now write the table (will replace the current file)
	print(df)
	df.fillna('')
	
	# add the dataFrame into the database
	df.to_sql(tablename, conn, if_exists='replace', index = False)

	cursor.close()

	return jsonify(message)

@app.route('/save_metrics', methods=['GET', 'POST'])
def save_metrics():
	message = request.get_json()
	print('======= save_metrics', message)

	data = message['data']
	tablename = message['tablename']
	dbname = message['dbname']
	print('!!! dbname, tablename', dbname, tablename)

	#add the timestamp
	CT = pytz.timezone('America/Chicago')
	data['timestamp'] = datetime.now(CT).strftime('%m/%d/%Y %H:%M:%S')

	db = os.path.join(current_location, 'static','data','sqlite3', dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")

	tables = [x[0] for x in cursor.fetchall()]

	if (tablename in tables):
		# if this is an existing table, then read it in
		print('!!! have table')
		cursor.execute('SELECT * FROM ' + tablename)
		columns = [description[0] for description in cursor.description]
		df = pd.DataFrame(cursor.fetchall(), columns = columns)   

	else:
		# if the table does not exist, create a new DataFrame
		print('!!! creating new table')
		columns = list(data.keys())
		df = pd.DataFrame(columns = columns)

	#add the new data (I think this will fail if the columns aren't the same)
	df = df.append(data, ignore_index=True)
	df.fillna('')
	print('============== check', data, df)
	
	# add the dataFrame into the database
	df.to_sql(tablename, conn, if_exists='replace', index = False)

	cursor.close()

	return jsonify(message)

@app.route('/get_table_names', methods=['GET', 'POST'])
def get_table_names():
	message = request.get_json()
	print('======= get_table_names', message)

	# connect to the SQL database and check if the table exists
	dbname = message['dbname']
	print('!!! dbname', dbname)

	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
	tables = [x[0] for x in cursor.fetchall()]
	cursor.close()

	out = {'tables':tables}

	return jsonify(out)

@app.route('/check_user_submitted', methods=['GET', 'POST'])
def check_user_submitted():
	global userSubmitted

	message = request.get_json()
	#print('======= check_user_submitted', message)

	groupname = message['groupname']
	dbname = message['dbname']
	tablename = message['tablename']

	# set the userSubmitted flag
	if (groupname not in userSubmitted):
		userSubmitted[groupname] = dict()
	if (dbname not in userSubmitted[groupname]):
		userSubmitted[groupname][dbname] = dict()
	if (tablename not in userSubmitted[groupname][dbname]):
		userSubmitted[groupname][dbname][tablename] = dict()
		userSubmitted[groupname][dbname][tablename] = False

	out = {'submitted':userSubmitted[groupname][dbname][tablename],'data':message}
	#print('!!! groupname, dbname, tablename, submitted', groupname, dbname, tablename, out['submitted'])

	# reset
	userSubmitted[groupname][dbname][tablename] = False

	return jsonify(out)

@app.route('/add_new_groupname', methods=['GET', 'POST'])
def add_new_groupname():

	message = request.get_json()
	print('======= add_new_groupname', message)
	groupname = message['groupname']

	success = True

	if (groupname == ''):
		success = False

	#check if this groupname exists already
	if (success):
		dbname = 'available_dbs.db'
		tablename = 'dbs'

		# connect to the SQL database and load the table
		db = os.path.join(current_location, 'static','data','sqlite3',dbname)
		conn = sqlite3.connect(db)
		cursor = conn.cursor()
		cursor.execute('SELECT * FROM ' + tablename)
		columns = [description[0] for description in cursor.description]
		df = pd.DataFrame(cursor.fetchall(), columns = columns)    
		cursor.close()

		#print('check', groupname, df['groupname'].to_list())
		glist = df['groupname'].to_list()
		if (groupname in glist or re.sub('[^A-Za-z0-9]+', '',groupname) in glist or re.sub('[^A-Za-z0-9]+', '',groupname).lower() in glist):
			success = False

	#create the new groupname
	if (success):
		#get the default paragraphs
		dbname = 'default.db'
		db = os.path.join(current_location, 'static','data','sqlite3',dbname)
		conn = sqlite3.connect(db)
		cursor = conn.cursor()
		cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
		tables = [x[0] for x in cursor.fetchall()]

		#add each of these tables to the new database, but without any responses
		dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
		db = os.path.join(current_location, 'static','data','sqlite3',dbname)
		conn_new = sqlite3.connect(db)
		for t in tables:
			cursor.execute('SELECT * FROM ' + t)
			columns = [description[0] for description in cursor.description]
			df = pd.DataFrame(cursor.fetchall(), columns = columns)
			if (t != 'paragraphs'):
				df = df[0:0]
			df.to_sql(t, conn_new, if_exists='replace', index = False)
		cursor.close()

		#append to the available_dbs file
		db = os.path.join(current_location, 'static','data','sqlite3','available_dbs.db')
		conn = sqlite3.connect(db)
		df = pd.DataFrame()
		cursor = conn.cursor()
		cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
		tables = [x[0] for x in cursor.fetchall()]
		if ('dbs' in tables):
			cursor.execute('SELECT * FROM dbs')
			columns = [description[0] for description in cursor.description]
			df = pd.DataFrame(cursor.fetchall(), columns = columns) 
			df = df.append({'groupname':groupname}, ignore_index=True).drop_duplicates()
		else:
			df = pd.DataFrame({'groupname':[groupname]})
		df.to_sql('dbs', conn, if_exists='replace', index = False)


	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/delete_groupname', methods=['GET', 'POST'])
def delete_groupname():

	message = request.get_json()
	print('======= delete_groupname', message)
	groupname = message['groupname']

	success = True

	# connect first in case this throws an error, then we wouldn't delete the file
	db = os.path.join(current_location, 'static','data','sqlite3','available_dbs.db')
	conn = sqlite3.connect(db)
	cursor = conn.cursor()

	#delete the database file
	dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	if os.path.exists(db):
		os.remove(db)
	else:
		success = False

	#remove from the available_dbs file
	if (success):
		cursor.execute('SELECT * FROM dbs')
		columns = [description[0] for description in cursor.description]
		df = pd.DataFrame(cursor.fetchall(), columns = columns) 
		df = df.loc[df['groupname'] != groupname]
		df.to_sql('dbs', conn, if_exists='replace', index = False)
		cursor.close()

	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/rename_groupname', methods=['GET', 'POST'])
def rename_groupname():

	message = request.get_json()
	print('======= rename_groupname', message)
	groupname = message['groupname']
	newname = message['newname']

	success = True

	# connect first in case this throws an error, then we wouldn't rename the file
	db = os.path.join(current_location, 'static','data','sqlite3','available_dbs.db')
	conn = sqlite3.connect(db)
	cursor = conn.cursor()

	#rename the database file
	dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	dbname_new = re.sub('[^A-Za-z0-9]+', '',newname).lower()+'.db'
	db_new = os.path.join(current_location, 'static','data','sqlite3',dbname_new)
	if os.path.exists(db):
		os.rename(db, db_new)
	else:
		success = False

	#rename in the available_dbs file
	if (success):
		cursor.execute('SELECT * FROM dbs')
		columns = [description[0] for description in cursor.description]
		df = pd.DataFrame(cursor.fetchall(), columns = columns) 
		df.replace({'groupname': {groupname: newname}}, inplace = True)
		df.to_sql('dbs', conn, if_exists='replace', index = False)
		cursor.close()

	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/delete_paragraph', methods=['GET', 'POST'])
def delete_paragraph():

	message = request.get_json()
	print('======= delete_paragraph', message)
	groupname = message['groupname']
	paragraphname = message['paragraphname']

	success = True

	#remove from the paragraphs table
	dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute('SELECT * FROM paragraphs')
	columns = [description[0] for description in cursor.description]
	df = pd.DataFrame(cursor.fetchall(), columns = columns) 
	df = df.loc[df['paragraphname'] != paragraphname]
	df.to_sql('paragraphs', conn, if_exists='replace', index = False)

	#remove table 
	tablename = re.sub('[^A-Za-z0-9]+', '',paragraphname).lower()
	cursor.execute('DROP TABLE ' + tablename +';')
	cursor.close()

	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/rename_paragraph', methods=['GET', 'POST'])
def rename_paragraph():

	message = request.get_json()
	print('======= rename_paragraph', message)
	groupname = message['groupname']
	paragraphname = message['paragraphname']
	newname = message['newname']

	success = True

	#rename row in the paragraphs list 
	dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute('SELECT * FROM paragraphs')
	columns = [description[0] for description in cursor.description]
	df = pd.DataFrame(cursor.fetchall(), columns = columns) 
	df.replace({'paragraphname': {paragraphname: newname}}, inplace = True)
	df.to_sql('paragraphs', conn, if_exists='replace', index = False)

	#rename the table
	cleanPara = re.sub('[^A-Za-z0-9]+', '',paragraphname).lower()
	cleanNew = re.sub('[^A-Za-z0-9]+', '',newname).lower()
	cursor.execute("ALTER TABLE `" + cleanPara + "` RENAME TO `" + cleanNew + "`")

	cursor.close()

	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/delete_paragraph_rows', methods=['GET', 'POST'])
def delete_paragraph_rows():

	message = request.get_json()
	print('======= delete_paragraph_rows', message)
	groupname = message['groupname']
	paragraphname = message['paragraphname']
	tableName = re.sub('[^A-Za-z0-9]+', '',paragraphname).lower()
	indices = message['rowsToRemove']

	success = True

	dbname = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	db = os.path.join(current_location, 'static','data','sqlite3',dbname)
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute('SELECT * FROM ' + tableName)
	columns = [description[0] for description in cursor.description]
	df = pd.DataFrame(cursor.fetchall(), columns = columns) 
	df.drop(indices, inplace = True)
	df.to_sql(tableName, conn, if_exists='replace', index = False)

	cursor.close()

	out = {'data':message,'success':success}

	return jsonify(out)

@app.route('/download_metricsSQL')
def download_metricsSQL():
	db = os.path.join(current_location, 'static','data','sqlite3','CHiMaD_metrics.db')
	return send_file(db, as_attachment=True)

@app.route('/download_metricsCSV')
def download_metricsCSV():
	db = os.path.join(current_location, 'static','data','sqlite3','CHiMaD_metrics.db')
	conn = sqlite3.connect(db)
	cursor = conn.cursor()
	cursor.execute('SELECT * FROM loginMetrics')
	columns = [description[0] for description in cursor.description]
	df = pd.DataFrame(cursor.fetchall(), columns = columns)    
	cursor.close()

	resp = make_response(df.to_csv())
	resp.headers["Content-Disposition"] = "attachment; filename=CHiMaD_metrics.csv"
	resp.headers["Content-Type"] = "text/csv"
	return resp



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

@app.route('/admin')
def admin():
	return render_template('admin.html', inDesktopApp=inDesktopApp)

# comment this part out when adding it to the production server
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000, use_reloader=True)