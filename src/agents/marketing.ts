import { generateContent } from '../services/llm';

export async function proactiveMarketingAgent(userProfile: any, campaignContext: string, memory: any[], sentiment: string = 'neutral') {
  let styleRule = 'TONE: Conversational, casual, human. Use 1 or 2 fun emojis.';
  
  if (sentiment === 'happy') {
    styleRule = 'TONE: Extremely FUN, GenZ style, use modern internet slang, and keep the promotion meme-like!';
  }

  const prompt = `
  You are Avinash, a human store assistant. You are reaching out proactively to a customer on Telegram.
  
  CAMPAIGN CONTEXT: ${campaignContext}
  USER PROFILE: ${JSON.stringify(userProfile)}
  RECENT CHAT HISTORY: ${JSON.stringify(memory)}
  
  CORE RULES:
  1. TWO-SENTENCE STRUCTURE (CRITICAL): You must write exactly two sentences. 
     - Sentence 1: Empathize with and directly answer the user's LAST message in the chat history. (e.g. "I am still checking on the exact timeframe for your order!")
     - Sentence 2: Pivot to the promotion smoothly. (e.g. "But while you wait, I just wanted to let you know we started a secret flash sale.")
  2. BANNED WORDS: NEVER use the words "Hey", "Hi", or "Hello". 
  3. NO PREAMBLE: Output ONLY the exact text message you want to send. Do NOT say "Here is my attempt:". 
  4. ${styleRule}
  
  Write the exact message to send to the user now.
  `;

  return await generateContent(prompt);
}

export async function analyzeIrritation(memory: any[]) {
  const prompt = `
  Analyze the following conversation history.
  You must determine if the user is irritated, annoyed, or wants the automated messages to stop.
  Also, extract the overall 'sentiment' of the user's messages as one of: "happy", "neutral", "angry", "sad".
  
  Respond STRICTLY in JSON format matching this schema:
  {
    "is_irritated": boolean,
    "wants_to_stop": boolean,
    "safe_to_promote": boolean,
    "sentiment": "string",
    "reason": "Brief explanation"
  }
  
  Conversation History:
  ${JSON.stringify(memory)}
  `;

  try {
    const result = await generateContent(prompt, { responseFormat: 'json' });
    return JSON.parse(result);
  } catch (error) {
    console.error('Irritation analysis failed:', error);
    // Safe default: don't send promos if analysis fails
    return { is_irritated: false, wants_to_stop: false, safe_to_promote: false, sentiment: 'neutral', reason: 'Fallback due to error' };
  }
}
