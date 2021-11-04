#https://github.com/ClimenteA/flaskwebgui
#I edited the flaskwebgui code to continue using Chrome for Windows (instead of edge)
#to create executable using pyinstaller:
# https://pyinstaller.readthedocs.io/en/stable/
# and see also here https://stackoverflow.com/questions/35478526/pyinstaller-numpy-intel-mkl-fatal-error-cannot-load-mkl-intel-thread-dll 
# -- needed to add extra hook-mkl.py to my Anaconda3/envs/default/Lib/site-packages/PyInstaller/hooks directory
# -- my mkl dll file is in the anaconda Libary bin directory (found using which command in terminal)
# and here : https://github.com/smoqadam/PyFladesk/issues/9
# $ pyinstaller -F CHiMaD-GUI.py
# $ pyinstaller -F -w --add-data "templates;templates" --add-data "static;static" CHiMaD-SDC-app.py

from flaskwebgui import FlaskUI
from __init__ import app,setInDesktopApp
setInDesktopApp()

FlaskUI(app, width=1280, height=720).run()