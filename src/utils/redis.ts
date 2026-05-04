import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Create a reusable Redis connection
let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
if (redisUrl.startsWith('"') && redisUrl.endsWith('"')) {
  redisUrl = redisUrl.slice(1, -1);
}

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  family: 4,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

redisConnection.on('error', (err: any) => {
  if (err.message && err.message.includes('ECONNRESET')) return; // Suppress Upstash idle drops
  console.error('Redis connection error:', err);
});
