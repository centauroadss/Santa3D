import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

cmds = [
    'mysql -u root -p"MERcenta2026!.ds" -e "CREATE USER IF NOT EXISTS \'copa2026_user\'@\'%\' IDENTIFIED BY \'MERcenta2026!.ds\'; GRANT ALL PRIVILEGES ON copa2026.* TO \'copa2026_user\'@\'%\'; FLUSH PRIVILEGES;"'
]

for cmd in cmds:
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

client.close()
