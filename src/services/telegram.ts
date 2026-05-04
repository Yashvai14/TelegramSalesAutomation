import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }
    
    return (await response.json()) as any;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}
