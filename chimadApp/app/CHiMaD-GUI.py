#https://github.com/ClimenteA/flaskwebgui
#I edited the flaskwebgui code to continue using Chrome for Windows (instead of edge)
#to create executableusing pyinstaller:
# https://pyinstaller.readthedocs.io/en/stable/
# and see also here https://stackoverflow.com/questions/35478526/pyinstaller-numpy-intel-mkl-fatal-error-cannot-load-mkl-intel-thread-dll 
# -- need to add extra hook-mkl.py to my Anaconda3/envs/default/Lib/site-packages/PyInstaller/hooks directory
# $ pyinstaller -F CHiMaD-GUI.py
from flaskwebgui import FlaskUI
from __init__ import app

FlaskUI(app, width=1280, height=720).run()