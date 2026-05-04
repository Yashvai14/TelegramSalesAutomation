import { query } from '../db';
import { redisConnection } from '../utils/redis';

export async function getOrCreateUser(telegramChatId: number, name?: string) {
  const checkResult = await query(
    'SELECT * FROM users WHERE telegram_chat_id = $1',
    [telegramChatId]
  );

  if (checkResult.rows.length > 0) {
    return checkResult.rows[0];
  }

  const insertResult = await query(
    `INSERT INTO users (telegram_chat_id, name) 
     VALUES ($1, $2) RETURNING *`,
    [telegramChatId, name || 'Unknown']
  );

  return insertResult.rows[0];
}

export async function getActiveConversation(userId: string) {
  const activeResult = await query(
    `SELECT id FROM conversations 
     WHERE user_id = $1 AND status != 'closed' 
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (activeResult.rows.length > 0) {
    return activeResult.rows[0].id;
  }

  const newResult = await query(
    `INSERT INTO conversations (user_id, status) 
     VALUES ($1, 'active') RETURNING id`,
    [userId]
  );

  return newResult.rows[0].id;
}

export async function getConversationStatus(conversationId: string) {
  const result = await query(
    `SELECT status FROM conversations WHERE id = $1`,
    [conversationId]
  );
  return result.rows[0]?.status || 'active';
}

export async function markConversationEscalated(conversationId: string) {
  await query(
    `UPDATE conversations SET status = 'human_escalated', last_message_at = NOW() WHERE id = $1`,
    [conversationId]
  );
}

export async function saveMessage(conversationId: string, telegramMessageId: number, sender: 'user' | 'ai' | 'human_agent', content: string) {
  const result = await query(
    `INSERT INTO messages (conversation_id, telegram_message_id, sender, content) 
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [conversationId, telegramMessageId, sender, content]
  );
  
  await query(
    `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
    [conversationId]
  );
  
  try {
    const cacheKey = `chat_history:${conversationId}`;
    await redisConnection.rpush(cacheKey, JSON.stringify({ sender, text: content }));
    await redisConnection.ltrim(cacheKey, -20, -1);
  } catch (error) {
    // Ignore redis errors, fallback to postgres
  }
  
  return result.rows[0].id;
}

export async function getRecentHistory(conversationId: string) {
  try {
    const cacheKey = `chat_history:${conversationId}`;
    const history = await redisConnection.lrange(cacheKey, 0, -1);
    if (history.length > 0) {
      return history.map(item => JSON.parse(item));
    }
  } catch (error) {
    // Redis failed
  }

  const result = await query(
    `SELECT sender, content as text 
     FROM messages 
     WHERE conversation_id = $1 
     ORDER BY created_at DESC 
     LIMIT 20`,
    [conversationId]
  );
  return result.rows.reverse();
}

// NEW: Store and retrieve long-term/behavioral memory to strictly match architecture diagram
export async function saveMemory(userId: string, type: 'short_term' | 'long_term' | 'behavioral', key: string, value: any) {
  await query(
    `INSERT INTO memory (user_id, type, key, value) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, type, key) 
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [userId, type, key, JSON.stringify(value)]
  );
}

export async function getMemory(userId: string, type: 'short_term' | 'long_term' | 'behavioral') {
  const result = await query(
    `SELECT key, value FROM memory WHERE user_id = $1 AND type = $2`,
    [userId, type]
  );
  return result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
}
