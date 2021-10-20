#!/opt/anaconda3/bin/python

import sys
sys.path.insert(0,'/var/www/html/chimadApp')
sys.path.insert(0,'/opt/anaconda3/bin')

def application(envonr, start_response):
   status = '200 OK'
   output = u''
   output += u'sys.version = %s\n' % repr(sys.version)
   output += u'sys.prefix = %s\n' % repr(sys.prefix)
   output += u'sys.executable = %s\n' % repr(sys.executable)
 
   response_headers = [('Content-type', 'text/plain'),
   ('Content-Length', str(len(output)))]
   start_response(status, response_headers)
 
   return [output.encode('UTF-8')]
