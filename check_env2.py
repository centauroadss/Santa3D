import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker exec project_copa2026.1.4cz4oocpry2ueseshbr6lne00 printenv')
content = stdout.read()
print(content.decode())
client.close()
