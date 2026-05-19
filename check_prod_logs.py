import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker logs --tail 100 $(docker ps -q --filter "name=project_copa2026.1")')

with open('prod_logs.txt', 'wb') as f:
    f.write(b"STDOUT:\n")
    f.write(stdout.read())
    f.write(b"\nSTDERR:\n")
    f.write(stderr.read())

client.close()
