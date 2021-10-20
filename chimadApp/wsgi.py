#!/opt/anaconda3/bin/python

import sys
sys.path.insert(0,'/var/www/html/chimadApp')
sys.path.insert(0,'/opt/anaconda3/bin')

from app import app as application
