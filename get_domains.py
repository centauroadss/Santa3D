import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('find /etc/easypanel/projects -name "meta.json"')
files = stdout.read().decode('utf-8').strip().split('\n')
for f in files:
    if 'copa2026' in f:
        stdin, out, err = client.exec_command(f'cat {f}')
        try:
            data = json.loads(out.read().decode('utf-8'))
            if 'domains' in data:
                print(f"Dominios para {f}:")
                for d in data['domains']:
                    print(f" - {d['host']}")
        except:
            pass

client.close()
