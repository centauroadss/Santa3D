import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q -f name=project_copa2026.1 -l) node scripts/bcv-scraper.js')
print("BCV SCRAPER:")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
