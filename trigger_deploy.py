import paramiko
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('ls -lat /etc/easypanel/projects/*/services/copa2026/builds | head -n 10')
print("Build logs:")
print(stdout.read().decode())

# Assuming the path is /etc/easypanel/projects/project/services/copa2026/builds/...
stdin, stdout, stderr = client.exec_command('cat $(ls -t /etc/easypanel/projects/*/services/copa2026/builds/*.log | head -1) | tail -n 50')
print("\nLatest log tail:")
print(stdout.read().decode())

client.close()
