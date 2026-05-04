const https = require('https');

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '/bot8625096441:AAEuPyClhO2vCl0y9RSRvJB9TqiNvnaZC8o/setWebhook?url=https://3da2e7456367f7.lhr.life/webhook/telegram',
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', error => {
  console.error(error);
});

req.end();
