const https = require('https');

const options = {
  hostname: 'api.1inference.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://creator-hub-nine-livid.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,authorization'
  }
};

const req = https.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});
req.end();
