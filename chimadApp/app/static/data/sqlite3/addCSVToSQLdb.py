import pandas as pd
import sqlite3
import re
import os

def addCSVToSQLdb(dbName, csvName, path=''):
	
	# read in the csv file
	df = pd.read_csv(os.path.join(path, csvName))

	# connect to the SQL database (this will create a file if it does not already exist)
	conn = sqlite3.connect(dbName)
	cursor = conn.cursor()
	
	# the table name within the databse will be the csv file name w/o .csv
	# and take only alphanumeric values
	tableName = re.sub(r'\W+', '',csvName.replace('.csv','')) 

	# include all columns, and assume that they are all text
	# allow only alphanumeric values in column names
	cols = ''
	for col in df.columns:
		cc = re.sub(r'\W+', '', col) 
		cols += cc + ' text, ' 
	cols = cols[:-2]

	# create the table
	cursor.execute('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + cols + ')')
	conn.commit()
	
	# add the dataFrame into the database
	df.to_sql(tableName, conn, if_exists='replace', index = False)