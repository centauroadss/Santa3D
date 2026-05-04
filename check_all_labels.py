import paramiko
import json

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

stdin, stdout, stderr = client.exec_command("docker service inspect project_copa2026")
output = stdout.read().decode()
try:
    data = json.loads(output)
    labels = data[0]["Spec"]["Labels"]
    for k, v in labels.items():
        print(f"{k} = {v}")
except Exception as e:
    print("Error parsing JSON:", e)

client.close()
