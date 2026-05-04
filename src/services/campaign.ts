import { query } from '../db';
import { logger } from '../utils/logger';
import { getRecentHistory, getOrCreateUser, saveMessage } from './memory';
import { analyzeIrritation, proactiveMarketingAgent } from '../agents/marketing';
import { sendMessage } from './telegram';

export async function startCampaignRunner() {
  logger.info('Started Proactive Marketing Campaign Runner (runs strictly every 1 minute)...');
  
  const runCampaign = async () => {
    try {
      // Find active conversations that have been idle for more than 1 day
      const result = await query(
        `SELECT c.id, c.user_id, u.telegram_chat_id 
         FROM conversations c
         JOIN users u ON c.user_id = u.id
         WHERE c.status = 'active' 
         AND c.last_message_at < NOW() - INTERVAL '1 day'`
      );

      for (const row of result.rows) {
        const conversationId = row.id;
        const chatId = row.telegram_chat_id;
        
        logger.info(`Checking idle conversation ${conversationId} for proactive outreach...`);
        
        // 1. Fetch memory
        const memory = await getRecentHistory(conversationId);
        
        // 2. Check irritation
        const analysis = await analyzeIrritation(memory);
        logger.info(`Irritation Analysis for ${chatId}: ${JSON.stringify(analysis)}`);
        
        if (!analysis.safe_to_promote || analysis.is_irritated || analysis.wants_to_stop) {
          logger.info(`Skipping promotion for ${chatId}. Reason: ${analysis.reason}`);
          continue;
        }

        // 3. Fetch User Profile
        const userResult = await query(`SELECT * FROM users WHERE id = $1`, [row.user_id]);
        const userProfile = userResult.rows[0];

        // 4. Generate & Send Promotion
        const promoMsg = await proactiveMarketingAgent(userProfile, "Secret weekend flash sale on all items!", memory, analysis.sentiment);
        
        let sentMsg;
        try {
          sentMsg = await sendMessage(chatId, promoMsg);
        } catch (telegramErr) {
          logger.error(`Failed to send promo to ${chatId}. Marking as failed to prevent retries. Error:`, telegramErr);
          await query(`UPDATE conversations SET status = 'blocked', updated_at = NOW() WHERE id = $1`, [conversationId]);
          continue;
        }
        
        // 5. Save to memory and update timestamp so it doesn't immediately trigger again
        await saveMessage(conversationId, sentMsg.result.message_id, 'ai', promoMsg);
        await query(`UPDATE conversations SET last_message_at = NOW() WHERE id = $1`, [conversationId]);
        
        logger.info(`Successfully sent proactive promo to ${chatId}`);
      }
    } catch (error) {
      logger.error('Campaign Runner Error:', error);
    }
    
    // Schedule next run exactly 1 minute AFTER this one finishes
    setTimeout(runCampaign, 60 * 1000);
  };
  
  // Start the first loop
  setTimeout(runCampaign, 60 * 1000);
}
