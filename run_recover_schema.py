import paramiko
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

with open('c:\\Users\\joaou\\copa2026\\scripts\\recover-bcv.js', 'r', encoding='utf-8') as f:
    script_content = f.read()

with open('c:\\Users\\joaou\\copa2026\\prisma\\schema.prisma', 'r', encoding='utf-8') as f:
    schema_content = f.read()

# Copy script and schema to container
cmd = f'''
container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1)

docker exec -i $container_id bash -c "cat > /app/prisma/schema.prisma" << 'EOF'
{schema_content}
EOF

docker exec $container_id npx prisma generate
docker exec $container_id npx prisma db push --accept-data-loss

docker exec -i $container_id bash -c "cat > /app/recover-bcv.js" << 'EOF'
{script_content}
EOF

docker exec $container_id node /app/recover-bcv.js
'''

stdin, stdout, stderr = client.exec_command(cmd)
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())
client.close()
