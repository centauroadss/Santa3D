import paramiko
import json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasas = await prisma.tasaBcvHistorico.findMany({ orderBy: { fecha: 'desc' } });
  console.log(JSON.stringify(tasas, null, 2));
}
main().finally(() => prisma.$disconnect());
"""

sftp = client.open_sftp()
with sftp.file('/tmp/check_clean.js', 'w') as f:
    f.write(script)
sftp.close()

client.exec_command('docker cp /tmp/check_clean.js $(docker ps -q --filter "name=project_copa2026.1"):/app/check_clean.js')
stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") node /app/check_clean.js')

print(stdout.read().decode('utf-8'))
client.close()
