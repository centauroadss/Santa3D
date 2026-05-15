import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

python_script = """
import mysql.connector

conn = mysql.connector.connect(
    host='172.17.0.1',
    user='copa2026_user',
    password='MERcenta2026!.ds',
    database='copa2026'
)
cursor = conn.cursor()
cursor.execute("DELETE FROM tasa_bcv_historico WHERE id = 10")
conn.commit()
print("Deleted id 10")
cursor.close()
conn.close()
"""

with client.open_sftp() as sftp:
    with sftp.file('/root/delete_data.py', 'w') as f:
        f.write(python_script)

stdin, stdout, stderr = client.exec_command('docker run --rm -v /root/delete_data.py:/tmp/delete_data.py python:3.9-slim bash -c "pip install -q mysql-connector-python && python /tmp/delete_data.py"')
print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))

client.close()
