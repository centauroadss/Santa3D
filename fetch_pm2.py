import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("pm2 logs copa2026 --lines 50 --nostream")
with open("pm2_logs.log", "wb") as f:
    f.write(stdout.read())
    f.write(stderr.read())

client.close()
