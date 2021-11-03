#https://github.com/ClimenteA/flaskwebgui
from flaskwebgui import FlaskUI
from __init__ import app

FlaskUI(app, width=1920, height=1080).run()