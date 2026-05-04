import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

export async function generateContent(prompt: string, options?: { responseFormat?: 'json' }) {
  try {
    const requestOptions: any = {};
    
    if (options?.responseFormat === 'json') {
      requestOptions.responseMimeType = 'application/json';
    }
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: requestOptions,
    });
    
    return response.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export async function generateContentWithTools(prompt: string) {
  const systemInstruction = `
  You have access to tools. To use a tool, reply EXACTLY with this JSON and nothing else:
  {"tool_call": "tool_name", "arguments": {"arg1": "value"}}
  
  Available tools:
  - track_order: args: { order_id: string }
  - recommend_products: args: { style: string }
  
  If you don't need a tool, just reply normally.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    const text = response.text || '';
    
    try {
      // Check if it's a valid JSON tool call
      const parsed = JSON.parse(text);
      if (parsed.tool_call) return parsed;
    } catch(e) {
      // Not a JSON, return the normal text
      return text;
    }
  } catch (error) {
    console.error('Gemini Tool API Error:', error);
    throw error;
  }
}
