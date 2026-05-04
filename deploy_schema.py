import paramiko
import time

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

commands = [
    "cd /var/www/copa2026 && git fetch origin copa2026 && git reset --hard origin/copa2026",
    "cd /var/www/copa2026 && npx prisma db push --accept-data-loss",
    "cd /var/www/copa2026 && npm run build",
    "pm2 restart copa2026"
]

for cmd in commands:
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)

client.close()
