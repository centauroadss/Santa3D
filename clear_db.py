import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

script = """
import subprocess
try:
    print(subprocess.check_output(['grep', '-r', 'deployWebhookUrl', '/etc/easypanel']).decode())
except Exception as e:
    print(e)
"""

cmd = f'cat << \'EOF\' > /tmp/deploy.py\n{script}\nEOF\npython3 /tmp/deploy.py'
stdin, stdout, stderr = client.exec_command(cmd)

print("Stdout:")
print(stdout.read().decode('utf-8', 'replace'))
print("Stderr:")
print(stderr.read().decode('utf-8', 'replace'))

client.close()
