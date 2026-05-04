import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q -f name=project_copa2026.1 -l)")
stdin, stdout, stderr = client.exec_command("curl -s -I http://10.11.72.132:3000")
print("CURL 1:")
print(stdout.read().decode())
stdin, stdout, stderr = client.exec_command("curl -s -I http://10.0.3.188:3000")
print("CURL 2:")
print(stdout.read().decode())

client.close()
