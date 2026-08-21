# n8n Workflow Setup Guide

This guide explains how to create the n8n AI workflow that powers NexusAI.

## Prerequisites

- A running n8n instance (Cloud, self-hosted, or local)
- An AI/LLM API key (OpenAI, Google Gemini, Anthropic, etc.)

## Workflow Overview

```
Webhook (POST) → Validate Request → AI Agent/LLM → Format Response → Webhook Response
```

## Step-by-Step Setup

### 1. Create a New Workflow

In your n8n instance, create a new workflow called "NexusAI Chat".

### 2. Add Webhook Node (Trigger)

- **Node type**: Webhook
- **HTTP Method**: POST
- **Path**: Choose a path (e.g., `nexusai-chat`)
- **Authentication**: Header Auth
  - **Header Name**: `X-Webhook-Secret`
  - **Header Value**: Create a strong secret (e.g., generate with `openssl rand -hex 32`)
- **Response Mode**: "Last Node"

> ⚠️ Copy the **Production Webhook URL** — this is your `N8N_WEBHOOK_URL` environment variable.
> The Header Value is your `N8N_WEBHOOK_SECRET` environment variable.

### 3. Add a Code/Function Node (Validate Request)

Add a Code node to validate the incoming request:

```javascript
// Validate incoming request
const body = $input.first().json.body || $input.first().json;

if (!body.message || typeof body.message !== 'string') {
  throw new Error('Invalid request: message is required');
}

if (body.message.length > 16000) {
  throw new Error('Message too long');
}

return [{
  json: {
    conversationId: body.conversationId || 'unknown',
    message: body.message,
    history: body.history || [],
  }
}];
```

### 4. Add AI Agent / LLM Node

Choose one of these depending on your LLM provider:

#### Option A: OpenAI Chat Model

- **Node type**: OpenAI > Chat Model
- **Model**: gpt-4o-mini (or gpt-4o)
- **System Prompt**:

```
You are NexusAI, a professional AI coding assistant. You help developers with:
- Code generation in any programming language
- Debugging and error explanation
- Code refactoring and optimization
- Technical explanations
- Best practices and design patterns

Format your responses using Markdown:
- Use code blocks with language identifiers for code
- Use headings for organization
- Use lists for multiple points
- Be concise but thorough

Always specify the programming language in code blocks (e.g., ```python, ```javascript).
```

- **Messages**: Build from the history array + current message
- Set up using a Code node before this to format messages:

```javascript
const input = $input.first().json;
const messages = [];

// Add conversation history
if (input.history && Array.isArray(input.history)) {
  for (const msg of input.history.slice(-10)) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }
}

return [{ json: { messages } }];
```

#### Option B: Google Gemini (via HTTP Request)

Use an HTTP Request node to call the Gemini API directly.

#### Option C: AI Agent Node

- **Node type**: AI Agent
- **Agent Type**: Conversational Agent
- Connect to your preferred Chat Model sub-node

### 5. Add Response Formatting Node

Add a Code node to format the response:

```javascript
const aiResponse = $input.first().json;

// Extract the response text based on the AI node output format
let responseText = '';

if (typeof aiResponse === 'string') {
  responseText = aiResponse;
} else if (aiResponse.text) {
  responseText = aiResponse.text;
} else if (aiResponse.output) {
  responseText = aiResponse.output;
} else if (aiResponse.message?.content) {
  responseText = aiResponse.message.content;
} else if (aiResponse.choices?.[0]?.message?.content) {
  responseText = aiResponse.choices[0].message.content;
} else {
  responseText = JSON.stringify(aiResponse);
}

// Generate a title from the first message (for new conversations)
const originalMessage = $('Webhook').first().json.body?.message || '';
const title = originalMessage.substring(0, 80);

return [{
  json: {
    response: responseText,
    title: title,
  }
}];
```

### 6. Connect the Nodes

```
Webhook → Validate Request → Format Messages → AI Agent/LLM → Format Response
```

The Webhook node's "Response Mode: Last Node" will automatically return the output of the last node as the webhook response.

### 7. Activate the Workflow

- Click "Save" then "Activate" (toggle switch)
- Test with a curl command:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{
    "conversationId": "test-123",
    "message": "Write a hello world in Python",
    "history": []
  }'
```

## Environment Variables

After setting up the workflow, add these to your `.env.local` and Vercel:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/nexusai-chat
N8N_WEBHOOK_SECRET=your-secret-from-step-2
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `X-Webhook-Secret` header matches |
| 500 Internal Error | Check n8n execution logs |
| Timeout | Increase timeout in n8n settings; check LLM API |
| Empty response | Check response format node; verify AI node output |

## Production Considerations

1. **Use n8n Cloud** or a reliable self-hosted setup for production
2. **Set webhook authentication** — never use a public webhook
3. **Monitor executions** in the n8n dashboard
4. **Set up error workflows** in n8n for alerting
5. **Rate limit** at the application layer (already implemented in the API)
