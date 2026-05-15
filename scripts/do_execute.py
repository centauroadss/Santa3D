import paramiko
import sys

command = sys.argv[1] if len(sys.argv) > 1 else 'docker ps | grep mysql'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds', timeout=10)

stdin, stdout, stderr = client.exec_command(command)
sys.stdout.buffer.write(stdout.read())
err = stderr.read()
if err:
    sys.stderr.buffer.write(err)

client.close()
