#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting Deployment: Story Templates Feature${NC}"

# 1. BACKUP
echo -e "\n${YELLOW}1. [BACKUP] Creating safety backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="../santa3d_backup_pre_stories_${TIMESTAMP}.tar.gz"
# Backup current dir to parent
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf "$BACKUP_FILE" .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Backup created at: $BACKUP_FILE${NC}"
else
    echo -e "${RED}   ❌ Backup failed! Aborting.${NC}"
    exit 1
fi

# 2. RUN FILE UPDATES
echo -e "\n${YELLOW}2. [UPDATE] Writing new file contents...${NC}"
# Source the parts instead of executing to ensure they run in same shell context if needed, but ./ is fine for file writing
chmod +x deploy_part_1.sh deploy_part_2.sh deploy_part_3.sh
./deploy_part_1.sh
./deploy_part_2.sh
./deploy_part_3.sh

# 3. BUILD & RESTART
echo -e "\n${YELLOW}3. [BUILD] Installing and Building...${NC}"
npm install --legacy-peer-deps

export NODE_OPTIONS="--max-old-space-size=3584"
if npm run build; then
    echo -e "${GREEN}   ✅ Build Successful${NC}"
else
    echo -e "${RED}   ❌ Build Failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}4. [RESTART] Restarting Services...${NC}"
pm2 restart all

echo -e "\n${GREEN}✨ DEPLOYMENT COMPLETE!${NC}"
echo "Verify at: /admin/stories-results"
