import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker logs $(docker ps -q -f name=project_copa2026.1 -l)")
with open('local_logs.txt', 'w', encoding='utf-8') as f:
    f.write("LOGS:\\n")
    f.write(stdout.read().decode('utf-8', errors='ignore'))
    f.write(stderr.read().decode('utf-8', errors='ignore'))

client.close()
