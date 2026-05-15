import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

# Encontrar el nombre del contenedor de la copa2026
command = 'docker exec $(docker ps -q --filter "name=copa2026" | head -n 1) grep -A 5 "Regla R1" lib/copa2026/bcv-sync.ts || echo "Not found"'
print("Running command on prod:", command)

stdin, stdout, stderr = client.exec_command(command)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')

print("=== STDOUT ===")
print(out)
if err:
    print("=== STDERR ===")
    print(err)

client.close()
