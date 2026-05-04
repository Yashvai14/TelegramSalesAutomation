import { generateContent } from '../services/llm';

export async function orchestrate(text: string, memory: any[]) {
  const prompt = `
  You are the intent router for an AI assistant for a D2C brand. Analyze the user's message.
  
  Respond STRICTLY in JSON format matching this schema:
  {
    "agent": "sales" | "support" | "retention" | "general",
    "confidence": 0-1,
    "sentiment": "happy" | "neutral" | "angry",
    "complexity": "simple" | "high",
    "reason": "Brief explanation of routing decision"
  }
  
  Recent Conversation Context: ${JSON.stringify(memory)}
  
  User Message: "${text}"
  `;

  try {
    const result = await generateContent(prompt, { responseFormat: 'json' });
    return JSON.parse(result);
  } catch (error) {
    console.error('Orchestration failed, defaulting to general agent:', error);
    return { agent: 'general', confidence: 0, sentiment: 'neutral', complexity: 'simple', reason: 'Fallback due to error' };
  }
}
