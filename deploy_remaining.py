import paramiko

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {user}@{host}...")
    client.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully. Executing commands...")

    commands = [
        # Setup .env for Resend
        "cd /var/www/copa2026 && grep -v '^RESEND_API_KEY=' .env > .env.tmp && mv .env.tmp .env",
        "cd /var/www/copa2026 && echo 'RESEND_API_KEY=\"re_atbYuibo_8BkDuDN5rVgKZMeGbLLUCMk1\"' >> .env",
        "cd /var/www/copa2026 && grep -v '^RESEND_FROM_EMAIL=' .env > .env.tmp && mv .env.tmp .env",
        "cd /var/www/copa2026 && echo 'RESEND_FROM_EMAIL=\"mercadeo@centauroads.com\"' >> .env",
        
        # We assume build succeeded, let's just restart pm2
        "cd /var/www/copa2026 && npm run build",
        
        # PM2
        "cd /var/www/copa2026 && pm2 delete copa2026 || true",
        "cd /var/www/copa2026 && pm2 start npm --name 'copa2026' -- start -- -p 3001",
        "pm2 save",

        # Nginx Config
        """cat << 'EOF' > /etc/nginx/sites-available/copa2026
server {
    listen 80;
    server_name copa2026.centauroads.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 600M;
    }
}
EOF""",
        "ln -sf /etc/nginx/sites-available/copa2026 /etc/nginx/sites-enabled/",
        "nginx -t && systemctl reload nginx",

        # Prisma Migrate
        "mkdir -p /var/www/backups",
        "mysqldump -u root santa3d > /var/www/backups/backup_santa3d_pre_copa2026_$(date +%Y%m%d_%H%M%S).sql",
        "cd /var/www/copa2026 && npx prisma db push --accept-data-loss"
    ]

    for cmd in commands:
        print(f"Executing: {cmd[:60]}...")
        stdin, stdout, stderr = client.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        
        # Write output to file instead of printing directly to avoid cp1252 errors
        out = stdout.read()
        err = stderr.read()
        with open("deploy_out.log", "ab") as f:
            f.write(f"\n--- CMD: {cmd[:60]} ---\n".encode('utf-8'))
            if out: f.write(out)
            if err: f.write(err)
            
        if exit_status != 0:
            print(f"Command failed with exit status {exit_status}. Check deploy_out.log")
            break
        print("Success.")
        
    print("Deployment finished.")
finally:
    client.close()
