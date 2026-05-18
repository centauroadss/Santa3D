import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

cmd = 'ls -la /etc/easypanel/backups/mysql || ls -la /var/lib/docker/volumes/easypanel_backups/_data'
stdin, stdout, stderr = client.exec_command(cmd)
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())
client.close()
