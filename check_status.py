import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker ps --format "{{.ID}} {{.Names}} {{.CreatedAt}} {{.Status}}"')
output = stdout.read().decode('utf-8')

for line in output.split('\\n'):
    if 'project_copa2026' in line:
        print(line)

client.close()
