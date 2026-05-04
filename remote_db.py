import sqlite3
import json

try:
    conn = sqlite3.connect('/etc/easypanel/easypanel.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services WHERE name='copa2026'")
    row = cursor.fetchone()
    if row:
        print(json.dumps(dict(row), indent=2))
    else:
        print("No service found")
    conn.close()
except Exception as e:
    print("Error:", e)
