import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker service ls | grep copa")
print("SERVICE LS:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("docker service ps project_copa2026 --no-trunc")
print("SERVICE PS:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("docker service logs project_copa2026")
print("SERVICE LOGS:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
