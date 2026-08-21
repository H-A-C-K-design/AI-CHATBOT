# NexusAI — Intelligent Coding Companion

A production-ready ChatGPT-style AI chatbot web application for developers, powered by **n8n** AI workflows and **Firebase Authentication**.

## Architecture

```
User → Next.js Frontend → Authenticated API Routes → n8n Webhook → AI/LLM → Response
              ↕                      ↕
      Firebase Auth          Firestore Database
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Authentication | Firebase Auth (Google + GitHub OAuth) |
| Database | Cloud Firestore |
| AI/Automation | n8n (webhook + AI workflow) |
| Deployment | Vercel |

## Features

- 🔐 **Real authentication** — Google and GitHub OAuth via Firebase
- 💬 **ChatGPT-style interface** — Sidebar, conversations, message composer
- 🤖 **AI-powered responses** — Connected to n8n AI workflows (not mock)
- 📝 **Markdown rendering** — Safe rendering with syntax highlighting
- 📋 **Code blocks** — Syntax highlighting + one-click copy
- 🔍 **Search conversations** — Find past conversations
- ✏️ **Rename/delete conversations** — Full conversation management
- 🌓 **Dark/light theme** — Professional design with theme toggle
- 📱 **Responsive** — Desktop, tablet, and mobile layouts
- 🔒 **Security-first** — Rate limiting, input validation, XSS protection
- ⚡ **Real-time** — No fake data, no mock responses

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication enabled
- A running n8n instance
- An AI/LLM provider API key (configured in n8n)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-chatbot-hack
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method:
   - Enable **Google** provider
   - Enable **GitHub** provider (requires GitHub OAuth App — see below)
4. Go to Project Settings → General → Your apps → Add web app
5. Copy the Firebase config values
6. Go to Project Settings → Service accounts → Generate new private key
7. Add `localhost` to Authentication → Settings → Authorized domains

### 3. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: Get from Firebase Console → Authentication → GitHub provider
3. Copy the Client ID and Client Secret into Firebase's GitHub provider config

### 4. n8n Workflow Setup

See [`docs/n8n-workflow-setup.md`](docs/n8n-workflow-setup.md) for detailed instructions.

### 5. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (private — from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# n8n (private)
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/nexusai-chat
N8N_WEBHOOK_SECRET=your-webhook-secret
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Firestore Indexes

Firestore will auto-create indexes for simple queries. If you see index errors, the error message will include a link to create the required index.

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` to Vercel settings
4. Deploy

### Post-Deployment

1. Add your Vercel domain to Firebase → Authentication → Authorized domains
2. Update GitHub OAuth App callback URL with production domain
3. Update n8n webhook if needed
4. Verify all environment variables are set in Vercel

## Project Structure

```
app/
  api/
    chat/route.ts          # Main chat endpoint
    conversations/          # CRUD endpoints
  chat/
    page.tsx               # New chat page
    [id]/page.tsx          # Conversation page
    layout.tsx             # Chat layout with sidebar
  login/page.tsx           # Login page
  settings/page.tsx        # Settings page
  layout.tsx               # Root layout
  page.tsx                 # Root redirect

components/
  auth/                    # Auth provider, login form
  chat/                    # Chat UI components
  layout/                  # Sidebar
  ui/                      # Theme toggle

lib/
  firebase/                # Firebase client + admin SDKs
  auth/                    # Session verification
  database/                # Firestore CRUD operations
  n8n/                     # n8n webhook client
  security/                # Rate limiter
  validation/              # Zod schemas, sanitization

types/                     # TypeScript type definitions
middleware.ts              # Route protection + security headers
```

## Security

- ✅ Firebase ID token verification on every API request
- ✅ Server-side conversation ownership checks
- ✅ Input validation with Zod
- ✅ Rate limiting (per-user sliding window)
- ✅ Safe Markdown rendering (rehype-sanitize)
- ✅ XSS protection (no raw HTML from AI)
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ No secrets in client-side code
- ✅ No internal error details exposed to users

## License

Private — All rights reserved.
