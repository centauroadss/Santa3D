import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker logs --tail 50 easypanel-copa2026-app')
print(stdout.read().decode('utf-8'))
client.close()
