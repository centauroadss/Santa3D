import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker ps -a | grep build")
print("DOCKER BUILD CONTAINERS:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("docker service logs easypanel_easypanel --tail 100")
print("EASYPANEL LOGS:")
print(stdout.read().decode())

client.close()
