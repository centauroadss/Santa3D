import paramiko
import json

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker exec easypanel-easypanel-1 sh -c 'sqlite3 /etc/easypanel/easypanel.sqlite \"SELECT githubWebhookSecret FROM services WHERE name=\\'copa2026\\'\"'")
print("WEBHOOK SECRET:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
