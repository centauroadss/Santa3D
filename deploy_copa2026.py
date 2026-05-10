import paramiko
import json
import re

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

print("Buscando webhook de copa2026...")
stdin, stdout, stderr = client.exec_command('cat /etc/easypanel/projects/copa2026/services/app/meta.json')
content = stdout.read().decode('utf-8')

try:
    data = json.loads(content)
    if 'source' in data and 'deployWebhookUrl' in data['source']:
        webhook = data['source']['deployWebhookUrl']
        print(f"Webhook URL encontrado: {webhook}")
        print("Disparando webhook...")
        client.exec_command(f'curl -X POST "{webhook}"')
        print("Webhook disparado exitosamente!")
    else:
        print("No se encontro webhook en source.")
        print(data)
except Exception as e:
    print(f"Error parseando o ejecutando: {e}")
    # Fallback si no está ahí, buscar en todo
    stdin, stdout, stderr = client.exec_command('find /etc/easypanel/projects -name "meta.json"')
    files = stdout.read().decode('utf-8').strip().split('\n')
    for f in files:
        if 'copa2026' in f:
            stdin, out, err = client.exec_command(f'cat {f}')
            try:
                data = json.loads(out.read().decode('utf-8'))
                if 'source' in data and 'deployWebhookUrl' in data['source']:
                    webhook = data['source']['deployWebhookUrl']
                    print(f"Webhook URL encontrado en {f}: {webhook}")
                    print("Disparando webhook...")
                    client.exec_command(f'curl -X POST "{webhook}"')
                    print("Webhook disparado!")
            except:
                pass

client.close()
