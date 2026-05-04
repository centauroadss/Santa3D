import paramiko
import time

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

print("Restarting EasyPanel service to clear stuck queues...")
stdin, stdout, stderr = client.exec_command("docker service update --force easypanel")
exit_status = stdout.channel.recv_exit_status()
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
