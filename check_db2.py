import paramiko
import sys
import codecs

# Fix windows console encoding
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

cmd = '''
container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1)
docker exec $container_id npx prisma studio &>/dev/null &
sleep 1
docker exec $container_id npx prisma generate
docker exec $container_id node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tasaBcvHistorico.count().then(c => console.log('Total records:', c));
prisma.tasaBcvHistorico.findMany({ orderBy: { fecha: 'desc' }, take: 5 }).then(res => console.log(res)).finally(() => process.exit(0));
"
'''

stdin, stdout, stderr = client.exec_command(cmd)
print("OUT:", stdout.read().decode('utf-8', 'ignore'))
print("ERR:", stderr.read().decode('utf-8', 'ignore'))
client.close()
