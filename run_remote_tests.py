import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

cmd = 'container_id=$(docker ps -q --filter "name=project_copa2026.1" | head -n 1) && docker exec $container_id npx vitest run tests/unit/ocr-extractors.test.ts tests/integration/ocr-fields.test.ts tests/integration/validar-pago.test.ts'

print(f"Executing inside remote container...")
stdin, stdout, stderr = client.exec_command(cmd)

out = stdout.read()
err = stderr.read()

with open('remote_test_output.txt', 'wb') as f:
    f.write(out)
    f.write(err)

client.close()
