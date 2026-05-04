import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("ls -la /etc/easypanel/")
print("LS:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("sqlite3 -header -json /etc/easypanel/data/easypanel.sqlite \"SELECT githubWebhookSecret FROM services WHERE name='copa2026';\"")
print("SQLITE HOST:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
