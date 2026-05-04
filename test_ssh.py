import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {user}@{host}...")
    client.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully.")
    stdin, stdout, stderr = client.exec_command("pm2 list && ls -la /var/www")
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    with open("ssh_out.txt", "w", encoding="utf-8") as f:
        f.write("STDOUT:\n")
        f.write(out + "\n")
        if err:
            f.write("STDERR:\n")
            f.write(err + "\n")
    print("Output written to ssh_out.txt")
finally:
    client.close()
