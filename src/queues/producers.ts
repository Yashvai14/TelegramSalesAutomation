import { Queue } from 'bullmq';
import { redisConnection } from '../utils/redis';

// Define the queues
export const messageQueue = new Queue('incoming-messages', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
});
