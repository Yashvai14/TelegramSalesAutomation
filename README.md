# Telegram AI Sales Agent (Production Architecture)

This project is a production-grade Telegram AI Sales Agent built with Node.js, Hono, BullMQ, PostgreSQL, Redis, and Google Gemini API. It follows a highly scalable **Webhook + Message Queue** architecture designed for reliable async processing and human-like conversational flows.

## 🌟 Key Features
- **Webhook & Queue Architecture**: Telegram webhooks instantly push to a Redis-backed BullMQ queue, decoupling message reception from AI processing to prevent timeouts.
- **Intelligent Orchestration**: Messages are routed via Gemini to specialized agents (e.g., Sales, Support) based on intent, sentiment, and complexity.
- **Human Handoff**: Automatically detects angry users or high-complexity queries and routes them to human agents, preventing further AI intervention until resolved.
- **Proactive Campaigns**: A robust background loop monitors idle users and pushes personalized, context-aware promotional messages (e.g., Flash Sales) exactly 60 seconds after they go idle.
- **Durable Memory System**: Uses both Redis (for fast caching) and PostgreSQL (for durable storage) to maintain short-term chat history, long-term user profiles, and behavioral data.
- **Automated Tunneling**: Automatically spawns a secure Localtunnel and registers the Webhook with Telegram on startup for a seamless local development experience.

---

## 🛠️ Prerequisites
Before running the project, ensure you have the following installed:
1. **Node.js** (v18+)
2. **PostgreSQL** database (Local or Cloud like Supabase/Neon)
3. **Redis** server (Local or Cloud like Upstash)
4. **Google Gemini API Key** (Free tier available at Google AI Studio)

---

## 🚀 First-Time Setup Step-by-Step

### 1. Clone & Install
Ensure you are in the project directory, then install all dependencies:
```bash
npm install
```

### 2. Database Setup
You need to apply the schema to your PostgreSQL database to create the required tables (`users`, `conversations`, `messages`, `memory`).
Make sure your PostgreSQL database is running, then execute the migration script:
```bash
node apply_schema.js
```

### 3. Environment Variables
Create or verify your `.env` file in the root directory. It must contain the following keys:
```env
PORT=3001
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=rediss://user:password@endpoint.upstash.io:30000
```

---

## 🏃 How to Run the Bot (Every Time)

Because this project features an **Automated Localtunnel Integration**, you do NOT need to manually manage ngrok or set your Telegram webhooks.

Simply run the following command from your project directory:
```bash
npm run dev
```

### What happens when you run this?
1. The server starts on your defined `PORT`.
2. It automatically spins up a secure, public `localtunnel` URL.
3. It automatically pings the Telegram API to register this new URL as your Webhook.
4. It initializes the BullMQ Worker to process the queue.
5. It starts the 1-minute Proactive Marketing Campaign loop.

You will see the following logs confirming success:
```text
Server is running on port 3001
🚀 Automated Localtunnel running at: https://xxxx.loca.lt
✅ Webhook automatically registered with Telegram!
[INFO] Started Proactive Marketing Campaign Runner...
```

---

## 🧪 Testing the Bot
1. Send a message to your Telegram Bot.
2. Check your terminal: You should see the message being queued, routed, and processed.
3. Send a highly angry message to trigger the **Human Escalation** logic.
4. Stop replying for exactly 1 minute to watch the **Proactive Campaign Runner** execute a context-aware promotional message!

---

## ☁️ Deployment Instructions (Free Tier)

This application is designed to run for **free** continuously without you needing to keep your computer on!

### 1. Database & Cache
- **PostgreSQL**: Create a free Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com). Copy the connection string to your `DATABASE_URL`.
- **Redis**: Create a free Redis database on [Upstash](https://upstash.com). Copy the connection string to your `REDIS_URL`.

### 2. API Keys
- **Gemini**: Get a free API key from [Google AI Studio](https://aistudio.google.com). Set it as your `GEMINI_API_KEY`.
- **Telegram Bot**: Get your bot token from `@BotFather`. Set it as your `TELEGRAM_BOT_TOKEN`.

### 3. Hosting the Node.js Server
Deploy your backend using [Render](https://render.com) (or Railway):
1. Push this code to a GitHub repository.
2. Go to Render and create a **New Web Service**.
3. Connect your GitHub repository.
4. **Build Command**: `npm install && npm run build` (Make sure you add a build script to package.json to compile TS, or use `npx tsc`).
5. **Start Command**: `npm start` (or `npx tsx src/index.ts` if not compiling).
6. **Environment Variables**: Add all your keys from the `.env` file into Render's Environment section.
7. Click **Deploy**. Render will give you a public URL (e.g., `https://your-app.onrender.com`).

*(Note: When deployed, you might want to disable localtunnel and set your Webhook URL manually to your Render URL: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.onrender.com/api/webhook`)*
