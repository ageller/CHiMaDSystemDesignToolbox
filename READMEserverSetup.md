# Instructions for setting up a server on RHEL7

1.  I am going to try using anaconda to manage python.  This is a bit messy because (through trial and error), it appears that mod_wsgi only works when installed via pip3, but I can still use the pip3 from anaconda.  
	$ wget https://repo.anaconda.com/archive/Anaconda3-2021.05-Linux-x86_64.sh
	$ bash Anaconda3-2021.05-Linux-x86_64.sh
	-- https://docs.anaconda.com/anaconda/install/multi-user/
	-- I installed into /opt/anaconda3 so that this can be used by all users
	$ groupadd anacondaPython
	$ chgrp -R anacondaPython /opt/anaconda3
	$ usermod -a -G anacondaPython [username]

1a. install packages for flask (I'm sure I'll need to install more pacakges later)
	$ conda install flask

2. Install httpd and http-devel (for python3).  httpd is the executable that runs the apache web server.
	$ yum install httpd
	$ yum install httpd-devel

	-- The apache config is here : /etc/httpd/conf/httpd.conf
	-- The default location for the website files is :  /var/www/html/  
	-- Extra apache configuration files go here : /etc/httpd/conf.d/

3. Install mod-wsgi for python3 and add the configuration to apache's directory.  mod_wsgi connects apache to python.
	$ pip3 install mod-wsgi
	$ mod_wsgi-express install-module > /etc/httpd/conf.d/wsgi.conf

4. Set the Service Boot Behavior.  Run the following command to start the httpd service at boot:
	$ systemctl enable httpd

5. enable port 80 through the firewall
	$ firewall-cmd --zone=public --add-port=80/tcp --permanent
	$ firewall-cmd --reload

6. Important httpd commands:

	Start the server
	$ systemctl start httpd

	Restart the server
	$ systemctl restart httpd

	Check the status (useful if an error occurs)
	$ systemctl status httpd -l

	Stop the server
	$ systemctl stop httpd

7. I'm going to add a www group, making that the group for the var/www directory and adding chimad to that group
	$ groupadd www
	$ chgrp -R www /var/www
	$ chmod -R g+rwX /var/www
	$ usermod -a -G www [username]

8. If there is a specific user who will be working on the website (not a sudo-er), it might be useful to creat a symbolic link in the /home/[username]/public_html/ directory to /var/www . Then [username] can edit the pages without needing sudo privaleges.

9. Set up the flask environment.  I mostly followed this youTube video: https://www.youtube.com/watch?v=w0QDAg85Oow
	- within /var/www/html , I created the following directory structure (replace [appName] with the actual desired name of the app)
		[appName]/
		- logs/
		- app/
			- static/
			- templates/
	-The usual flask files will live in the /var/www/html/[appName]/app/ directory.  The main python file is named __init__.py and contains all the usual code except for the app.run part
	- within /var/www/html/[appNane]/ I created the following files
		- wsgi.py : this is the file that apache will see first and updates the system path and imports the application
		- run.py : this includes the app.run (or socketio.run) bit that is usually in my standalone python flask (dev) script
		- flask-app.conf : this has the apache configuration info that loads the flask app.  
			- I added a symbolic link to this conf file in the directory /etc/httpd/conf.d 
			- I set errors to appear in the logs/error.log file 
