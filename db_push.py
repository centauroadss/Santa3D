import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

commands = [
    'container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1) && docker exec $container_id npx prisma db push --accept-data-loss',
]

for cmd in commands:
    sys.stdout.buffer.write(f"Executing: {cmd}\n".encode('utf-8'))
    stdin, stdout, stderr = client.exec_command(cmd)
    
    out = stdout.read()
    err = stderr.read()
    
    if out:
        sys.stdout.buffer.write(b"STDOUT:\n" + out)
    if err:
        sys.stdout.buffer.write(b"STDERR:\n" + err)

client.close()
