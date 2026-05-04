const http = require('http');

const data = JSON.stringify({
  update_id: 12345,
  message: {
    message_id: 1,
    from: { id: 1111111, is_bot: false, first_name: 'Test', username: 'testuser' },
    chat: { id: 1111111, type: 'private' },
    date: 1612345678,
    text: 'Hello test!'
  }
});

const req = http.request('http://localhost:3001/webhook/telegram', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
