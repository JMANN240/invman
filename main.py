from flask import Flask, render_template, request, jsonify
import sqlite3
from os import urandom
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = urandom(24)
socketio = SocketIO(app, cors_allowed_origins="*")

def row_dictionary(row):
    return {key: value for key, value in zip(row.keys(), row)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scales', methods=['GET', 'POST'])
def api_scales():
    if request.method == 'GET':
        with sqlite3.connect('database.db') as connection:
            connection.row_factory = sqlite3.Row
            cursor = connection.cursor()
            cursor.execute('''SELECT * FROM scales''')
            return jsonify([row_dictionary(row) for row in cursor.fetchall()])

    if request.method == 'POST':
        print(request.json)
        mac = request.headers.get('Payload-Address')
        val = abs(int(request.json.get('val')))
        with sqlite3.connect('database.db') as connection:
            cursor = connection.cursor()
            cursor.execute('''INSERT OR IGNORE INTO scales (scale_id, state) VALUES (:mac, 'NEW')''', {'mac': mac})
            
            cursor.execute('''SELECT state, offset, calibration_units FROM scales WHERE scale_id=:mac''', {'mac': mac})
            row = cursor.fetchone()
            state = row[0]
            offset = row[1]
            calibration_units = row[2]

            if state == 'NORMAL':
                cursor.execute('''UPDATE scales SET weight=:val WHERE scale_id=:mac''', {'val': val-offset, 'mac': mac})

            elif state == 'TARE':
                cursor.execute('''UPDATE scales SET offset=:val, state="NORMAL" WHERE scale_id=:mac''', {'val': val, 'mac': mac})

            elif state == 'UNIT':
                cursor.execute('''UPDATE scales SET unit_weight=:val, state="NORMAL" WHERE scale_id=:mac''', {'val': (val-offset)/calibration_units, 'mac': mac})

        socketio.emit('new-data')
        return "200"

@app.route('/api/scales/state', methods=['GET', 'POST'])
def api_scales_state():
    if request.method == 'GET':
        with sqlite3.connect('database.db') as connection:
            connection.row_factory = sqlite3.Row
            cursor = connection.cursor()
            cursor.execute('''SELECT state FROM scales''')
            return jsonify([row_dictionary(row) for row in cursor.fetchall()])

    if request.method == 'POST':
        mac = request.form.get('mac')
        state = request.form.get('state')
        with sqlite3.connect('database.db') as connection:
            cursor = connection.cursor()
            if state == 'UNIT':
                calibration_units = int(request.form.get('units'))
                cursor.execute('''UPDATE scales SET state=:state, calibration_units=:calibration_units WHERE scale_id=:mac''', {'state': state, 'mac': mac, 'calibration_units': calibration_units})
                return "200"
            cursor.execute('''UPDATE scales SET state=:state WHERE scale_id=:mac''', {'state': state, 'mac': mac})
        return "200"

if (__name__ == '__main__'):
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
