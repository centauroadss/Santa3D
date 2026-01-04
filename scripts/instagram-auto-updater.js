// scripts/instagram-auto-updater.js
// Automating Instagram Stories & Posts for Santa 3D Contest
// Uses: Content Publishing API (Container based)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const { generateStoryImage, generateFeedImage, fetchContestStats } = require('../lib/instagram-image-generator');
const { generateInstagramCaption } = require('../lib/instagram-caption-generator');
const { publishToInstagram } = require('../lib/instagram-publisher');

// ============================================
// CONFIGURATION
// ============================================

// --- CONFIGURATION ---
const API_URL = process.env.CONTEST_API_URL || 'http://localhost:3000/api/instagram/stats'; // Base URL
const CONFIG_API_URL = API_URL.replace('/stats', '/config'); // Infer config URL

// Default Config (fallback)
let CONFIG = {
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  userId: process.env.INSTAGRAM_USER_ID,
  apiUrl: API_URL, // Use the derived API_URL
  storyHours: (process.env.STORY_SCHEDULE_HOURS || '8,20').split(',').map(h => parseInt(h.trim())),
  feedHours: (process.env.POST_SCHEDULE_HOURS || '12').split(',').map(h => parseInt(h.trim())),
  participationMsgs: [],
  votingMsgs: [],
  restrictToOfficialGrid: true,
  publicDir: path.join(__dirname, '../../public/temp-ig'), // Where to save images
  publicUrlBase: 'http://167.172.217.151/temp-ig',         // URL for Instagram to fetch from
  timerFormat: 'd-h' // Default
};

async function loadRemoteConfig() {
  try {
    console.log(`[Config] Fetching from ${CONFIG_API_URL}...`);
    const res = await axios.get(CONFIG_API_URL);
    const data = res.data;

    if (data.storyHours) {
      CONFIG.storyHours = data.storyHours.split(',').map(h => parseInt(h.split(':')[0]));
    }
    if (data.feedHours) {
      CONFIG.feedHours = data.feedHours.split(',').map(h => parseInt(h.split(':')[0]));
    }

    // Parse messages
    try { CONFIG.participationMsgs = JSON.parse(data.participationMsgs); } catch (e) { console.warn('[Config] Failed to parse participationMsgs:', e.message); }
    try { CONFIG.votingMsgs = JSON.parse(data.votingMsgs); } catch (e) { console.warn('[Config] Failed to parse votingMsgs:', e.message); }

    CONFIG.restrictToOfficialGrid = data.restrictToOfficialGrid;
    if (data.timerFormat) CONFIG.timerFormat = data.timerFormat;

    console.log('[Config] Loaded successfully:', CONFIG);
  } catch (e) {
    console.error('[Config] Failed to load remote config, using defaults.', e.message);
  }
}


// Ensure temp directory exists
if (!fs.existsSync(CONFIG.publicDir)) {
  fs.mkdirSync(CONFIG.publicDir, { recursive: true });
}

// ============================================
// CORE FUNCTIONS
// ============================================

async function runUpdate(type = 'FEED') {
  console.log(`\n============== STARTING ${type} UPDATE ==============`);
  try {
    // 1. Fetch Stats
    const stats = await fetchContestStats(CONFIG.apiUrl);
    console.log(`   📊 Stats: ${stats.participants} participants, ${stats.timeLeft.days} days left`);

    // 2. Generate Image & Publish
    await loadRemoteConfig(); // Ensure we have latest config before running
    if (type === 'STORY') {
      const buffer = await generateStoryImage(stats, CONFIG);
      await publishToInstagram(buffer, '', 'STORIES', CONFIG);
    } else {
      const buffer = await generateFeedImage(stats, CONFIG);
      // Generate Caption
      const captionData = {
        ...stats,
        recentParticipants: stats.recentParticipants || []
      };
      // Mocking caption generator call if needed or reusing lib
      const caption = generateInstagramCaption(captionData);
      await publishToInstagram(buffer, caption, 'IMAGE', CONFIG);
    }

  } catch (error) {
    console.error('   ❌ Job Failed:', error.message);
  }
}

// ============================================
// SCHEDULER
// ============================================

console.log('🤖 Instagram Auto-Updater Started');
console.log(`   POST Schedule (Hours): ${CONFIG.feedHours.join(', ')}`);
console.log(`   STORY Schedule (Hours): ${CONFIG.storyHours.join(', ')}`);

// Schedule Feed Posts
CONFIG.feedHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('FEED');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Feed Post at ${hour}:00 VET`);
});

// Schedule Stories
CONFIG.storyHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('STORY');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Story at ${hour}:00 VET`);
});

// Manual Run Detection (npm run manual)
if (process.argv.includes('--manual')) {
  console.log('   🧪 Manual Trigger Detected');
  (async () => {
    // Check for type arg
    const type = process.argv.includes('--feed') ? 'FEED' : 'STORY';
    await runUpdate(type);
  })();
}
