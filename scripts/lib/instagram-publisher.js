const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Publishes an image to Instagram (Story or Feed)
 * @param {Buffer} imageBuffer - The image data
 * @param {string} caption - Caption text (only for Feed)
 * @param {string} type - 'STORIES' or 'IMAGE' (Feed)
 * @param {Object} config - Configuration object (accessToken, userId, publicDir, publicUrlBase)
 */
async function publishToInstagram(imageBuffer, caption, type = 'IMAGE', config) {
    try {
        if (!config.accessToken || !config.userId) {
            throw new Error('Missing Instagram Credentials (accessToken or userId)');
        }

        // Ensure temp directory exists
        if (!fs.existsSync(config.publicDir)) {
            fs.mkdirSync(config.publicDir, { recursive: true });
        }

        // 1. Save Image Temporarily (Publicly Accessible)
        const filename = `ig-${type.toLowerCase()}-${Date.now()}.png`;
        const localPath = path.join(config.publicDir, filename);
        const publicUrl = `${config.publicUrlBase}/${filename}`;

        fs.writeFileSync(localPath, imageBuffer);
        console.log(`   📂 Saved temp image: ${localPath}`);
        console.log(`   🌐 Public URL: ${publicUrl}`);

        // Data for Container Creation
        const containerParams = {
            image_url: publicUrl,
            access_token: config.accessToken,
            is_carousel_item: false
        };

        if (type === 'IMAGE') {
            containerParams.caption = caption;
        } else if (type === 'STORIES') {
            containerParams.media_type = 'STORIES';
        }

        // 2. Create Media Container
        console.log(`   ⏳ Creating ${type} container...`);
        const containerUrl = `https://graph.facebook.com/v18.0/${config.userId}/media`;
        const containerRes = await axios.post(containerUrl, null, { params: containerParams });
        const creationId = containerRes.data.id;

        if (!creationId) throw new Error('No creation ID returned');
        console.log(`   ✅ Container Created ID: ${creationId}`);

        // Wait 5 seconds for Instagram to process the image
        // NOTE: In a route handler, this 5s delay is painful but necessary for the API.
        await new Promise(r => setTimeout(r, 8000)); // Increased to 8s for safety

        // 3. Publish Media
        console.log(`   🚀 Publishing...`);
        const publishUrl = `https://graph.facebook.com/v18.0/${config.userId}/media_publish`;
        const publishRes = await axios.post(publishUrl, null, {
            params: {
                creation_id: creationId,
                access_token: config.accessToken
            }
        });

        console.log(`   🎉 Published Successfully! Media ID: ${publishRes.data.id}`);

        // Cleanup: Delete temp file after a delay (e.g., 1 min)
        // We don't await this
        setTimeout(() => {
            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }, 60000);

        return { success: true, id: publishRes.data.id, log: `Published ${type} ID: ${publishRes.data.id}` };

    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('   ❌ Publishing Failed:', errorMsg);
        throw new Error(`Instagram API Error: ${errorMsg}`);
    }
}

module.exports = { publishToInstagram };
