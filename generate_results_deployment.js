const fs = require('fs');
const path = require('path');

// Files to deploy
const files = [
    // Instagram Fixes (ensure these are up to date)
    { src: 'scripts/lib/instagram-publisher.js', dest: 'scripts/lib/instagram-publisher.js' },
    { src: 'app/api/admin/instagram/publish/route.ts', dest: 'app/api/admin/instagram/publish/route.ts' },
    { src: 'scripts/instagram-auto-updater.js', dest: 'scripts/instagram-auto-updater.js' },
    // Results Grid Improvements
    { src: 'app/api/admin/results/route.ts', dest: 'app/api/admin/results/route.ts' },
    { src: 'app/admin/resultados/page.tsx', dest: 'app/admin/resultados/page.tsx' }
];

let scriptContent = '#!/bin/bash\n\n';
scriptContent += 'echo "🚀 Starting Deployment: Results Grid & Instagram Fixes..."\n\n';

// Create directories if they don\'t exist (just in case)
scriptContent += 'mkdir -p scripts/lib\n';
scriptContent += 'mkdir -p app/api/admin/instagram/publish\n\n';

files.forEach(file => {
    try {
        if (fs.existsSync(file.src)) {
            const content = fs.readFileSync(file.src, 'utf8');
            scriptContent += `echo "📦 Updating ${file.dest}..."\n`;
            scriptContent += `cat << 'EOF' > ${file.dest}\n`;
            scriptContent += content;
            if (!content.endsWith('\n')) scriptContent += '\n';
            scriptContent += 'EOF\n\n';
        } else {
            console.warn(`WARNING: Source file ${file.src} not found, skipping.`);
            scriptContent += `echo "⚠️  WARNING: Could not find source for ${file.dest}, skipping..."\n`;
        }
    } catch (e) {
        console.error(`Error reading ${file.src}:`, e.message);
    }
});

scriptContent += 'echo "🔄 Installing dependencies (if needed)..."\n';
scriptContent += '# npm install \n\n';

scriptContent += 'echo "🏗️  Building Next.js application..."\n';
scriptContent += 'npm run build\n\n';

scriptContent += 'echo "♻️  Restarting PM2 process..."\n';
scriptContent += 'pm2 restart all\n\n';

scriptContent += 'echo "✅ Deployment Complete! Verify at /admin/resultados"\n';

const outputPath = 'deploy_results.sh';
fs.writeFileSync(outputPath, scriptContent);
console.log(`${outputPath} created successfully with ${files.length} files.`);
