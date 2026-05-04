import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker exec $(docker ps -q -f name=easypanel.1) sh -c 'sqlite3 /etc/easypanel/easypanel.sqlite \"SELECT name, port FROM services WHERE name=\\'copa2026\\'\"'")
print("SQLITE:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
