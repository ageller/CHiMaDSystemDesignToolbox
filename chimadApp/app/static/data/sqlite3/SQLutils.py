import pandas as pd
import sqlite3
import re
import os

def addCSVToSQLdb(dbName, csvName, path=''):
	
	# read in the csv file
	fname = os.path.join(path, csvName)
	if (os.path.exists(fname)):
		df = pd.read_csv(os.path.join(path, csvName))

		# connect to the SQL database (this will create a file if it does not already exist)
		conn = sqlite3.connect(dbName)
		
		# the table name within the databse will be the csv file name w/o .csv
		# and take only alphanumeric values
		tableName = re.sub(r'\W+', '',csvName.replace('.csv','')) 
		
		# add the dataFrame into the database
		df.to_sql(tableName, conn, if_exists='replace', index = False)
	else:
		print('file does not exist', fname)

def createNewSQLdbFromCSVs(groupname, paras, remove=True):
	db = re.sub('[^A-Za-z0-9]+', '',groupname).lower()+'.db'
	if (os.path.exists(db) and remove):
		try:
			os.remove(db)
		except:
			print("Can't remove file ", db)

	# create the paragraphs table
	allPara = pd.read_csv('../csv/paragraphs.csv')
	df = pd.DataFrame(columns = allPara.columns)
	for d in paras:
		use = allPara.loc[allPara['paragraphname'].str.replace(' ', '').str.lower() == d.replace(' ', '').lower()]
		df = df.append(use, ignore_index=True)

	conn = sqlite3.connect(db)

	df.to_sql('paragraphs', conn, if_exists='replace', index = False)

	# create the rest of the tables
	for d in paras:
		csvname = re.sub('[^A-Za-z0-9]+', '',d).lower() + '.csv'
		addCSVToSQLdb(db, csvname, '../csv/')

	#append to the database list file
	conn = sqlite3.connect('available_dbs.db')
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

	cursor.close()