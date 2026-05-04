import paramiko
import json

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("ls -la /etc/easypanel/data/easypanel.sqlite /etc/easypanel/data/db.sqlite /etc/easypanel/easypanel.sqlite")
print("FILES:")
print(stdout.read().decode())

client.close()
