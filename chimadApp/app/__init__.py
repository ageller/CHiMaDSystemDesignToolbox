from flask import Flask, render_template
from flask_socketio import SocketIO
from threading import Lock


# Set this variable to "threading", "eventlet" ,"gevent" or "gevent_uwsgi" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = "eventlet" #"eventlet" is WAY better than "threading"

app = Flask(__name__)
app.config['SECRET_KEY'] = 'CHiMaD!'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()

@app.route("/")
def default():
	return render_template("index.html")

# comment this part out when adding it to the production server
if __name__ == "__main__":
	socketio.run(app, host='0.0.0.0', port=5000, use_reloader=False)