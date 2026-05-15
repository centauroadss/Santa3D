import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds', timeout=10)

cmd = 'mysql -u copa2026_user -pMERcenta2026!.ds copa2026 -e "SELECT id, fecha, fechaValor, tasaUsdBs FROM tasa_bcv_historico ORDER BY id DESC LIMIT 5;"'
stdin, stdout, stderr = client.exec_command(cmd)

sys.stdout.buffer.write(stdout.read())
err = stderr.read()
if err:
    sys.stderr.buffer.write(err)

client.close()
