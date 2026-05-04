import { Hono } from 'hono';
import { messageQueue } from '../queues';
import { logger } from '../utils/logger';

const webhookRouter = new Hono();

webhookRouter.post('/telegram', async (c) => {
  try {
    const body = await c.req.json();
    
    // Acknowledge immediately for Telegram
    if (body.message && body.message.text) {
      // Fire and forget to queue
      await messageQueue.add('process-message', {
        chatId: body.message.chat.id,
        text: body.message.text,
        messageId: body.message.message_id,
        firstName: body.message.from?.first_name,
        username: body.message.from?.username,
      }, { 
        jobId: `tg-msg-${body.message.message_id}` // BullMQ Idempotency
      });
      logger.info(`Queued message ${body.message.message_id} from ${body.message.chat.id}`);
    }
    
    return c.text('OK');
  } catch (error) {
    logger.error('Webhook error:', error);
    return c.text('Internal Server Error', 500);
  }
});

export default webhookRouter;
