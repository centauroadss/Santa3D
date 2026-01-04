const fs = require('fs');
const path = require('path');

const files = [
    { src: 'prisma/schema.prisma', dest: 'prisma/schema.prisma' },
    { src: 'app/api/admin/instagram/config/route.ts', dest: 'app/api/admin/instagram/config/route.ts' },
    { src: 'scripts/lib/instagram-image-generator.js', dest: 'scripts/lib/instagram-image-generator.js' },
    { src: 'scripts/instagram-auto-updater.js', dest: 'scripts/instagram-auto-updater.js' },
    { src: 'app/admin/instagram-config/page_server.tsx', dest: 'app/admin/instagram-config/page_server.tsx' }
];

let scriptContent = '#!/bin/bash\n\necho "Starting deployment of Instagram fixes..."\n\n';

files.forEach(file => {
    try {
        const content = fs.readFileSync(file.src, 'utf8');
        scriptContent += `echo "Updating ${file.dest}..."\n`;
        scriptContent += `cat << 'EOF' > ${file.dest}\n`;
        scriptContent += content;
        if (!content.endsWith('\n')) scriptContent += '\n';
        scriptContent += 'EOF\n\n';
    } catch (e) {
        console.error(`Error reading ${file.src}:`, e.message);
    }
});

scriptContent += 'echo "Files updated."\n';
scriptContent += 'echo "Running Prisma DB Push..."\n';
scriptContent += 'npx prisma db push\n\n';
scriptContent += 'echo "Restarting application (optional, dependent on setup)..."\n';
scriptContent += '# pm2 restart all\n';
scriptContent += 'echo "Deployment Complete!"\n';

fs.writeFileSync('deployment_part15.sh', scriptContent);
console.log('deployment_part15.sh created successfully.');
