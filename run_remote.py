import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

with open("remote_db.py", "r") as f:
    script = f.read()

sftp = client.open_sftp()
with sftp.file('/tmp/remote_db.py', 'w') as f:
    f.write(script)

container_id = stdout.read().decode().strip().split('\\n')[0]
client.exec_command(f"docker cp /tmp/remote_db.py {container_id}:/tmp/remote_db.py")
stdin, stdout, stderr = client.exec_command(f"docker exec {container_id} python3 /tmp/remote_db.py")
print("SQLITE:")
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
