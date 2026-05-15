import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

while True:
    stdin, stdout, stderr = client.exec_command('docker ps --format "{{.ID}} {{.Names}} {{.Status}}"')
    output = stdout.read().decode('utf-8')
    status = ""
    for line in output.split('\\n'):
        if 'project_copa2026.1' in line:
            status = line
            break
            
    print("Container Status:", status)
    
    if "Up Less than a second" in status or "Up 1 second" in status or "Up 2 second" in status or "Up 3 second" in status or "Up 4 second" in status or "Up 5 second" in status or "Up 10 second" in status or "Up 15 second" in status or "Up 20 second" in status or "Up 30 second" in status or "Up 40 second" in status or "Up 50 second" in status:
        print("Container just restarted! Deploy finished!")
        break
    
    # Alternatively, just wait for "Up x seconds" or wait until the ID changes.
    time.sleep(5)

client.close()
