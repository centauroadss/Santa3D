import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("df -h")
print("DISK SPACE:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("docker ps | grep build")
print("BUILDERS:")
print(stdout.read().decode())

client.close()
