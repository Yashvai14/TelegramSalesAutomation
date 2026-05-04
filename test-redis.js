const Redis = require('ioredis');

const redis = new Redis("rediss://default:gQAAAAAAAbONAAIgcDFjZGZkNzVhYTYwM2Q0YjFiODMyOTY5OTBiMTk3MTc4Mw@nice-guppy-111501.upstash.io:6379");

redis.ping().then(res => {
  console.log('Redis Ping Response:', res);
  process.exit(0);
}).catch(err => {
  console.error('Redis Error:', err);
  process.exit(1);
});
