import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

cmds = [
    'mysql -u root -p"MERcenta2026!.ds" -e "DROP DATABASE IF EXISTS copa2026; CREATE DATABASE copa2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON copa2026.* TO \'copa2026_user\'@\'localhost\'; FLUSH PRIVILEGES;"',
    'cd /var/www/copa2026 && npx prisma db push',
    'cd /var/www/copa2026 && pm2 restart copa2026'
]

for cmd in cmds:
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

client.close()
