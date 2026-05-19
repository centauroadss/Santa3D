import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const v = await prisma.videoCopa2026.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log(JSON.stringify(v, null, 2));
}
main().finally(() => prisma.$disconnect());
"""

sftp = client.open_sftp()
with sftp.file('/tmp/check_video.js', 'w') as f:
    f.write(script)
sftp.close()

client.exec_command('docker cp /tmp/check_video.js $(docker ps -q --filter "name=project_copa2026.1"):/app/check_video.js')
stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") node /app/check_video.js')

print("STDOUT:")
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

client.close()
