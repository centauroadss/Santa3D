#!/bin/bash
cd /var/www/santa3d
tar -xzf deploy_full_update.tar.gz
export PATH=$PATH:/root/.nvm/versions/node/v20.10.0/bin
export NODE_OPTIONS='--max-old-space-size=4096'
npm install --legacy-peer-deps
npm run build
pm2 reload all
