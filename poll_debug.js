const https = require('https');

function poll() {
  https.get('https://copa2026.centauroads.com/api/debug-uploads', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
        console.log('JSON Response received!');
        console.log(data);
      } else {
        console.log(`Still 404 or HTML (status: ${res.statusCode}). Retrying in 5 seconds...`);
        setTimeout(poll, 5000);
      }
    });
  }).on('error', (err) => {
    console.log('Error:', err.message);
    setTimeout(poll, 5000);
  });
}

poll();
