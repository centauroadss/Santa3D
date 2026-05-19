import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

script_js = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.tasaBcvHistorico.deleteMany({
    where: {
      fuenteUrl: 'https://bcv.org.ve/script_recuperacion'
    }
  });
  console.log('Eliminados ' + result.count + ' registros falsos.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
"""

sftp = client.open_sftp()
with sftp.file('/tmp/delete_fake.js', 'w') as f:
    f.write(script_js)
sftp.close()

client.exec_command('docker cp /tmp/delete_fake.js $(docker ps -q --filter "name=project_copa2026.1"):/app/delete_fake.js')
print("Borrando registros falsos...")
stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") node /app/delete_fake.js')

print("STDOUT:")
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

client.close()
