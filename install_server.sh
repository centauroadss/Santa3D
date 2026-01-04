#!/bin/bash

# Define Variables
DB_USER="santa_db_user"
DB_PASS="SantaSecure2025!"
DB_NAME="santa3d"
APP_DIR="/var/www/santa3d"

echo "🚀 Starting Production Setup..."

# 1. Update System
sudo apt-get update
sudo apt-get install -y curl git nginx mysql-server unzip

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Configure MySQL
echo "📦 Configuring MySQL..."
# Create User and Database if they don't exist
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. Setup Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# Enable UFW non-interactively? carefully. default is inactive.
# sudo ufw --force enable 

# 5. Nginx Config
echo "🌐 Configuring Nginx..."
cat <<EOT | sudo tee /etc/nginx/sites-available/santa3d
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOT
sudo ln -sf /etc/nginx/sites-available/santa3d /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Install Dependencies & Build
echo "🏗️ Building Application..."
cd $APP_DIR

# Verify .env.production exists and copy to .env
if [ -f .env.production ]; then
    cp .env.production .env
else
    echo "⚠️ Warning: .env.production not found!"
fi

# Install and Build
npm install
npx prisma generate
npx prisma db push # Use push for prototyping/fast deploy without migrations history issues
npm run build

# 7. Start with PM2
echo "⚡ Starting Process..."
pm2 delete santa3d || true
pm2 start npm --name "santa3d" -- start
pm2 save

echo "✅ Deployment Complete! Visit your IP address."
