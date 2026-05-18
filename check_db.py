import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

cmd = 'container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1) && docker exec $container_id npx prisma studio' # wait, no, I just want to run a query.

cmd = 'container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1) && docker exec $container_id bash -c "npm run db:count || echo \'No script\'"'
# Wait, let's write a small script inside the container to query Prisma.
cmd = '''
container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1)
docker exec $container_id node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Inscripciones:', await prisma.inscripcionCopa2026.count());
  console.log('Pagos:', await prisma.pagoMovil.count());
}
main().catch(console.error).finally(() => prisma.\$disconnect());
"
'''
stdin, stdout, stderr = client.exec_command(cmd)
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())
client.close()
