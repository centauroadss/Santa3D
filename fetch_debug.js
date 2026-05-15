const https = require('https');

https.get('https://copa2026.centauroads.com/api/debug-uploads', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
