import paramiko
import sys
import time

host = "167.172.217.151"
user = "root"
password = "MERcenta2026!.ds"

commands = [
    # 1. Create DB and User
    "mysql -e \"CREATE DATABASE IF NOT EXISTS copa2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"",
    "mysql -e \"CREATE USER IF NOT EXISTS 'copa2026_user'@'localhost' IDENTIFIED BY 'MERcenta2026!.ds';\"",
    "mysql -e \"GRANT ALL PRIVILEGES ON copa2026.* TO 'copa2026_user'@'localhost';\"",
    "mysql -e \"FLUSH PRIVILEGES;\"",

    # 2. Setup codebase
    "mkdir -p /var/www/backups",
    "cd /var/www && if [ ! -d 'copa2026' ]; then cp -r santa3d copa2026; fi",
    "cd /var/www/copa2026 && git remote update && git fetch origin copa2026 && git checkout -B copa2026 origin/copa2026 && git pull origin copa2026",
    
    # Setup .env
    "cd /var/www/copa2026 && grep -v '^DATABASE_URL=' ../santa3d/.env > .env",
    "cd /var/www/copa2026 && echo 'DATABASE_URL=\"mysql://copa2026_user:MERcenta2026!.ds@localhost:3306/copa2026\"' >> .env",
    "cd /var/www/copa2026 && echo 'NEXTAUTH_URL=\"https://copa2026.centauroads.com\"' >> .env",
    
    # NPM Install and Build
    "cd /var/www/copa2026 && npm install",
    "cd /var/www/copa2026 && npm run build",
    
    # PM2
    "cd /var/www/copa2026 && pm2 start npm --name 'copa2026' -- start -- -p 3001",
    "pm2 save",

    # 3. Nginx Config
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
    "certbot --nginx -d copa2026.centauroads.com --non-interactive --agree-tos -m centauroadss@gmail.com || echo 'Certbot failed, ignoring'",

    # 5. Database Backup & Prisma Migrate
    "mysqldump -u root santa3d > /var/www/backups/backup_santa3d_pre_copa2026_$(date +%Y%m%d).sql",
    # Accept prompt from prisma automatically by setting environment variable or piping yes
    "cd /var/www/copa2026 && yes | npx prisma migrate dev --name copa2026_initial"
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {user}@{host}...")
    client.connect(host, username=user, password=password, timeout=10)
    print("Connected successfully. Executing commands...")
    
    for cmd in commands:
        print(f"Executing: {cmd[:50]}...")
        stdin, stdout, stderr = client.exec_command(cmd)
        
        # Wait for the command to finish
        exit_status = stdout.channel.recv_exit_status()
        
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        
        if out:
            print("STDOUT:", out[:500])
        if err:
            print("STDERR:", err[:500])
            
        if exit_status != 0:
            print(f"Command failed with exit status {exit_status}. Stopping.")
            break
        print("-" * 40)
        
    print("All commands executed.")
finally:
    client.close()
