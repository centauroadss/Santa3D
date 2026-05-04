import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

sftp = client.open_sftp()
sftp.put(r"c:\Users\joaou\copa2026\prisma\seeds\bancos.js", "/var/www/copa2026/prisma/seeds/bancos.js")
sftp.close()

stdin, stdout, stderr = client.exec_command("cd /var/www/copa2026 && node prisma/seeds/bancos.js")
exit_status = stdout.channel.recv_exit_status()
print(stdout.read().decode(errors='replace'))
print(stderr.read().decode(errors='replace'))

client.close()
