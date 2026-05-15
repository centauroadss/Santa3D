import paramiko
import sys
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds', timeout=10)

# Upload the SQL file
sftp = client.open_sftp()
local_path = os.path.join('prisma', 'migrations', '03_force_reset.sql')
remote_path = '/tmp/03_force_reset.sql'
sftp.put(local_path, remote_path)
sftp.close()

# Execute it with MySQL
cmd = 'mysql -u copa2026_user -pMERcenta2026!.ds copa2026 -e "SELECT email, password FROM admins LIMIT 1;"'
stdin, stdout, stderr = client.exec_command(cmd)

out = stdout.read()
err = stderr.read()

if out:
    sys.stdout.buffer.write(out)
if err:
    sys.stderr.buffer.write(err)

client.close()
