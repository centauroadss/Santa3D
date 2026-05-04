import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker exec easypanel_easypanel_1 sh -c 'cat /etc/easypanel/traefik/dynamic.yml | grep -A 5 -B 5 copa2026'")
print("TRAEFIK YML:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
