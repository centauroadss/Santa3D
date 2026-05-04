import paramiko
import json

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker ps -q -f name=easypanel")
container_id = stdout.read().decode().strip().split('\n')[0]

if container_id:
    cmd = f"docker exec {container_id} sh -c 'sqlite3 -header -json /etc/easypanel/easypanel.sqlite \"SELECT * FROM services WHERE name=\\'copa2026\\'\"'"
    stdin, stdout, stderr = client.exec_command(cmd)
    print("SQLITE:")
    print(stdout.read().decode())
    print(stderr.read().decode())
else:
    print("Container not found")

client.close()
