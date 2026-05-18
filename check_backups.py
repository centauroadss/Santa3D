import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('ls -la /etc/easypanel/backups || ls -la /var/backups')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
