# NEXORA AI — Intelligent Multi-Model Coding Companion

A high-performance, real-time ChatGPT-style developer workspace powered by **100% Real Multi-AI Engines** (Google Gemini, OpenAI GPT-4o, DeepSeek-R1) and **Firebase Authentication**.

## Architecture

```
User → Next.js 16 App Router → Authenticated SSE Streaming API (/api/chat) → Real Multi-AI Providers
               ↕                                                                   ↕
       Firebase Auth (OAuth)                                           [Google Gemini / OpenAI / DeepSeek]
               ↕
       Cloud Firestore Database
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Pure Custom Vanilla CSS Design System with Glassmorphism & Dark Mode |
| Authentication | Firebase Auth (Google + GitHub OAuth) |
| Database | Cloud Firestore (Sessions, Messages, Tech Intelligence) |
| AI Engines | Google Gemini (3.5 / 3.6 Flash), OpenAI (GPT-4o, GPT-4o-mini), DeepSeek-R1 |
| Real-time Stream | Server-Sent Events (SSE) with Token-by-Token Streaming & Live Reasoning |
| Deployment | Vercel |

## Features

- 🔐 **Real authentication** — Google and GitHub OAuth via Firebase
- 💬 **ChatGPT-style interface** — Sidebar, pinned chats, message composer, full markdown
- 🤖 **100% Genuine Multi-AI** — Google Gemini, OpenAI GPT-4o, DeepSeek-R1 (Zero mock, zero fake responses)
- 🧠 **Live Deep Thinking** — Real-time collapsible reasoning stream with timestamp metrics
- 📝 **Markdown rendering** — Safe rendering with syntax highlighting and instant copy
- 🔍 **Search conversations** — Fast client-side and database search for past sessions
- ✏️ **Full Chat Management** — Rename, delete, pin, and export conversations (Markdown/JSON)
- 🌓 **Dark/light theme** — Handcrafted high-contrast dark/light design system
- 📱 **Fully Responsive** — Optimized for desktop, tablet, and mobile displays
- 🔒 **Security-first** — Rate limiting, input sanitization, XSS protection, token verification

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication & Firestore enabled
- An API Key from at least one supported AI Provider:
  - Google Gemini API Key (`GEMINI_API_KEY`)
  - OpenAI API Key (`OPENAI_API_KEY`)
  - DeepSeek API Key (`DEEPSEEK_API_KEY`)

### 1. Clone and Install

```bash
git clone https://github.com/H-A-C-K-design/AI-CHATBOT.git
cd "AI CHATBOT HACK"
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with your credentials:

```env
# Firebase Client Configuration (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin Configuration (private)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Real AI Provider API Keys (configure at least one)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security & Architecture Principles

- ✅ Real-time ID token verification on every API route
- ✅ Zero mock / fake fallback policy — authentic provider execution
- ✅ Strict sliding-window rate limiting per authenticated UID
- ✅ Safe Markdown sanitization against XSS
- ✅ High token budget (8,192 tokens) for complete, unbroken code answers

## License

Private — All rights reserved.
