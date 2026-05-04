import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("sqlite3 /etc/easypanel/data/db.sqlite \".tables\"")
print("FIND:")
print(stdout.read().decode())

client.close()
