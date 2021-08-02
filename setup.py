import sqlite3

with sqlite3.connect('database.db') as connection:
    cursor = connection.cursor()

    cursor.execute('DROP TABLE IF EXISTS scales')
    cursor.execute('''
        CREATE TABLE scales (
            scale_id TEXT UNIQUE NOT NULL,
            nickname TEXT UNIQUE,
            unit_weight REAL,
            calibration_units INTEGER,
            offset REAL,
            state TEXT,
            weight REAL
        )
    ''')