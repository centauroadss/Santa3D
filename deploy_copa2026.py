import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") npx ts-node -e "const { PrismaClient } = require(\'@prisma/client\'); const prisma = new PrismaClient(); async function main() { const template = await prisma.plantillaEmail.findUnique({ where: { tipo: \'BIENVENIDA\' } }); console.log(JSON.stringify(template, null, 2)); } main().finally(() => prisma.$disconnect());"')
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

client.close()
