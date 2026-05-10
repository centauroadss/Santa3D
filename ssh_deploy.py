import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

print("Deploying copa2026 via easypanel CLI...")
stdin, stdout, stderr = client.exec_command('easypanel rebuild copa2026')
# Or maybe: easypanel deploy
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("STDOUT:", out)
print("STDERR:", err)

client.close()
