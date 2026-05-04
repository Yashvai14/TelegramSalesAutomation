import { Worker } from 'bullmq';
import { redisConnection } from '../utils/redis';
import { logger } from '../utils/logger';
import { getOrCreateUser, getActiveConversation, getConversationStatus, markConversationEscalated, saveMessage, getRecentHistory } from '../services/memory';
import { orchestrate } from '../agents/orchestrator';
import { salesAgent } from '../agents/sales';
import { sendMessage } from '../services/telegram';

export const messageWorker = new Worker('incoming-messages', async job => {
  const { chatId, text, messageId, firstName, username } = job.data;
  
  logger.info(`Processing message ${messageId} for chat ${chatId}`);

  try {
    const name = firstName || username || 'Unknown';
    const user = await getOrCreateUser(chatId, name);
    const conversationId = await getActiveConversation(user.id);
    
    // Check Status (Handoff Block)
    const status = await getConversationStatus(conversationId);
    if (status === 'human_escalated') {
      logger.info(`Chat ${chatId} is escalated to human. AI will continue to answer as requested.`);
    }
    
    try {
      await saveMessage(conversationId, messageId, 'user', text);
    } catch (e: any) {
      if (e.code === '23505') { // Postgres unique constraint violation
        logger.info(`Duplicate message ${messageId} ignored.`);
        return;
      }
      throw e;
    }
    
    const memory = await getRecentHistory(conversationId);
    
    // Orchestrate
    const routing = await orchestrate(text, memory);
    logger.info(`Routed to ${routing.agent} (Confidence: ${routing.confidence}, Sentiment: ${routing.sentiment}, Complexity: ${routing.complexity})`);
    
    // Handoff Logic (Only trigger if not already escalated)
    if (
      status !== 'human_escalated' &&
      (routing.confidence < 0.6 || 
       routing.sentiment === 'angry' || 
       routing.complexity === 'high')
    ) {
      logger.info(`Marking chat as human_escalated in DB. Reason: ${routing.reason}`);
      await markConversationEscalated(conversationId);
      // We no longer send a hardcoded handoff text or return early here. 
      // The AI will continue to generate a highly empathetic response.
    }
    
    // Execute Agent
    let responseText = '';
    switch (routing.agent) {
      case 'sales':
      case 'support':
      case 'retention':
      case 'general':
      default:
        // Mock fallback to sales for now
        responseText = await salesAgent(text, memory, user); 
        break;
    }
    
    const sentMsg = await sendMessage(chatId, responseText);
    await saveMessage(conversationId, sentMsg.result.message_id, 'ai', responseText);
    
    logger.info(`Successfully replied to chat ${chatId}`);
    
  } catch (error) {
    logger.error(`Failed to process message ${messageId}:`, error);
    throw error;
  }
}, { connection: redisConnection });

messageWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});
