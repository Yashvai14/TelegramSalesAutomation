import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhook';
import { logger } from './utils/logger';
import { startCampaignRunner } from './services/campaign';

dotenv.config();

const app = new Hono();

app.get('/', (c) => {
  return c.text('Telegram AI Agent Platform is running');
});

// Register webhook route
app.route('/webhook', webhookRouter);

// Initialize BullMQ Workers
import './workers/messageProcessor';

// Start the proactive 1-minute marketing loop
startCampaignRunner();

import localtunnel from 'localtunnel';

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

// Automate Tunnel & Webhook Registration for Local Development
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      const tunnel = await localtunnel({ port });
      console.log(`\n========================================`);
      console.log(`🚀 Automated Localtunnel running at: ${tunnel.url}`);
      
      const setWebhookUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${tunnel.url}/webhook/telegram`;
      const response = await fetch(setWebhookUrl);
      const data = await response.json() as any;
      
      if (data.ok) {
        console.log(`✅ Webhook automatically registered with Telegram!`);
      } else {
        console.error(`❌ Failed to register Webhook:`, data.description);
      }
      console.log(`========================================\n`);
      
      tunnel.on('close', () => {
        console.log('Tunnel closed.');
      });
    } catch (err) {
      console.error('Failed to start localtunnel:', err);
    }
  })();
}
