import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker logs --tail 200 project_copa2026.1.0lf34pqzsmufz99h2mo4efbsm')
content = stdout.read()
with open('docker_logs.txt', 'wb') as f:
    f.write(content)
client.close()
