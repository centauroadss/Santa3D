import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

cmd = 'docker logs --tail 100 $(docker ps -q --filter "name=project_copa2026.1" | head -n 1)'
stdin, stdout, stderr = client.exec_command(cmd)
with open('remote_logs.txt', 'wb') as f:
    f.write(stdout.read())
    f.write(stderr.read())
client.close()
