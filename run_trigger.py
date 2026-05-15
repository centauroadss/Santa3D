import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

with open('trigger_easypanel.js', 'r') as f:
    js_code = f.read()

# Escribir el script en el servidor y correrlo con node
stdin, stdout, stderr = client.exec_command('cat > /tmp/trigger.js && node /tmp/trigger.js')
stdin.write(js_code)
stdin.close()

print(stdout.read().decode())
print(stderr.read().decode())
client.close()
