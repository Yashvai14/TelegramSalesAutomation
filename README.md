<h1 align="center">Telegram AI Sales Automation Agent 🚀</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-FF4081?style=for-the-badge&logo=redis&logoColor=white" />
</p>

<p align="center">
  <strong>A production-ready, highly scalable Telegram Sales Agent powered by Gemini AI.</strong><br>
  Built with a robust Webhook & Message Queue architecture for zero message dropping and human-like conversational flows.
</p>

---

## 🌟 Architecture & Features

![Architecture Diagram](./architecture.png)

This platform is not just a simple chatbot. It uses an enterprise-grade backend architecture to handle high volumes of users asynchronously:

- 🛡️ **Webhook + Message Queue**: Telegram webhooks instantly push incoming messages to a **Redis-backed BullMQ queue**. This completely decouples message reception from AI processing, ensuring Telegram never times out and zero messages are dropped.
- 🧠 **Intelligent Orchestration (Gemini AI)**: Messages are dynamically routed to specialized AI Agents (e.g., Sales, Support, Marketing) based on intent, sentiment, and query complexity.
- 🤝 **Automated Human Handoff**: If a user is highly frustrated or asks a complex query that the AI cannot handle, the conversation is automatically frozen and escalated to a human agent.
- 🎯 **Proactive Idle Marketing**: A robust background cron loop monitors idle users. If a user stops responding for exactly 60 seconds, the agent proactively pushes personalized, context-aware promotional messages (like Flash Sales).
- 💾 **Durable Hybrid Memory**: Utilizes **Redis** for fast cache retrievals (short-term chat history) and **Supabase PostgreSQL** for durable, permanent storage (user profiles, behavioral data, and conversation logs).
- 🚇 **Zero-Config Local Dev**: Automatically spawns a secure Localtunnel and registers the Webhook with Telegram on startup for a seamless `npm run dev` experience.

---

## 🏗️ System Diagram & Schema

![System Architecture & Edge Cases](./system_diagram.png)

### Core Database Schema (PostgreSQL)
- **Users**: `id` (PK), `phone_number` (Unique), `name`, `created_at`
- **Conversations**: `id` (PK), `user_id` (FK), `status` (active/closed), `last_message_at`, `created_at`
- **Messages**: `id` (PK), `conversation_id` (FK), `sender` (user/ai), `content` (text), `message_type`, `twilio_sid` (Unique for Idempotency), `created_at`
- **Memory**: `id` (PK), `user_id` (FK), `type` (short_term | long_term | behavioral), `key`, `value` (JSONB), `updated_at`

### 🛡️ Edge Cases Handled
1. **Duplicate Messages (Retries)**: Prevented using Idempotency keys (`twilio_sid` / Telegram message IDs).
2. **AI Hallucination**: Handled by forcing strict tool-based JSON responses for critical queries (like order tracking).
3. **Slow AI Responses**: Handled gracefully using the async queue architecture and fallback "We're checking this..." messages if necessary.
4. **Multi-language Support (India-specific)**: The AI is prompted to automatically detect the user's language and respond in the same language.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following accounts and tools ready:
1. **Node.js** (v18 or higher)
2. **Supabase Account** (For free managed PostgreSQL)
3. **Upstash Account** (For free Serverless Redis)
4. **Google AI Studio Account** (For a free Gemini API Key)
5. **Telegram Bot Token** (From `@BotFather` on Telegram)

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/Yashvai14/TelegramSalesAutomation.git
cd TelegramSalesAutomation
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of your directory and populate it with your credentials:
```env
PORT=3000
NODE_ENV=development

# Telegram & AI
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here

# Databases
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
REDIS_URL="rediss://default:[password]@endpoint.upstash.io:6379"
```

### 3. Database Migration
Apply the database schema to your Supabase PostgreSQL database to create the required tables (`users`, `conversations`, `messages`, `memory`):
```bash
node apply_schema.js
```

### 4. Run the Server
Run the following command. The application will automatically start the server, create a secure public tunnel, and register the webhook with Telegram.
```bash
npm run dev
```

You will see logs confirming the setup:
```text
Server is running on port 3000
🚀 Automated Localtunnel running at: https://xxxx.loca.lt
✅ Webhook automatically registered with Telegram!
[INFO] Started Proactive Marketing Campaign Runner...
```

---

## ☁️ Production Deployment (Render Free Tier)

This application is strictly designed to be deployed for **free**, running 24/7 in the cloud without requiring local hardware.

### 1. Deploying to Render
1. Push your code to your GitHub repository.
2. Go to [Render](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Configure the build settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add your Environment Variables (`PORT`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `DATABASE_URL`, `REDIS_URL`).
   - **CRITICAL**: Add `NODE_ENV` and set it to `production`. This prevents Localtunnel from running in the cloud.
6. Click **Deploy**.

### 2. Register Production Webhook
Once Render provisions your live URL (e.g., `https://my-sales-agent.onrender.com`), you must manually register it with Telegram since Localtunnel is disabled.

Open your browser and paste this URL (replacing the tokens with your actual data):
```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_RENDER_URL>/webhook/telegram
```
You should receive a `{"ok":true,"result":true,"description":"Webhook was set"}` response!

---

## 🧪 Testing the Bot

1. **Standard Flow**: Send a generic message to your Bot on Telegram. Watch your terminal logs to see the queue ingestion and the Orchestrator agent route the request.
2. **Human Handoff**: Send an extremely angry message (e.g., "I HATE THIS, Let me talk to a human!"). The bot will apologize and pause the AI until a human intervenes.
3. **Proactive Campaign**: Stop responding to the bot for exactly **60 seconds**. The background cron worker will execute and send you a context-aware promotional hook!

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE). Feel free to fork, modify, and use it for your own AI automation businesses!
