const axios = require('axios');

async function testConfirm() {
  try {
    const res = await axios.post('http://localhost:3000/api/copa2026/video-upload/confirm', {
      tokenVideo: 'f417f7b3-c198-46c5-926e-41eb3111b0ce', // Raul's token based on previous chats (or whatever is in DB)
      videos: [
        {
          urlVideo: 'https://santa3d.sfo3.digitaloceanspaces.com/videos/RENDER/test.mp4',
          fileName: 'test.mp4',
          fileType: 'video/mp4',
          sizeBytes: 1000000,
          durationSeg: 30,
          resolution: '1024x2048',
          categoriaVideo: 'RENDER'
        }
      ]
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('ERROR RESPONSE:', err.response.status, err.response.data);
    } else {
      console.error('NETWORK ERROR:', err.message);
    }
  }
}

testConfirm();
