'use client';

// ============================================================
// Empty State Component — ChatGPT-Style Clean Welcome Screen
// Minimalist typography with 4 clean suggestion cards
// ============================================================
import { NexoraLogo } from '@/components/ui/nexora-logo';
import type { AIModelId, AIPersonaId } from '@/types';

interface EmptyStateProps {
  onSuggestion?: (
    prompt: string,
    options?: { model?: AIModelId; persona?: AIPersonaId }
  ) => void;
}

interface SuggestionCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
  persona: AIPersonaId;
  model: AIModelId;
}

const SUGGESTIONS: SuggestionCard[] = [
  {
    id: 'write-code',
    icon: '💻',
    title: 'Write code',
    subtitle: 'Build a production-ready API or component in TypeScript',
    prompt: 'Design and write a scalable, type-safe REST API route with rate-limiting and JWT authentication in TypeScript.',
    persona: 'code-engineer',
    model: 'gemini-3.5-flash',
  },
  {
    id: 'explain-concept',
    icon: '💡',
    title: 'Explain something',
    subtitle: 'Deep-dive into technical concepts or complex ideas',
    prompt: 'Explain how attention mechanisms and transformer models work with a clear, step-by-step breakdown.',
    persona: 'general-assistant',
    model: 'gemini-3.5-flash',
  },
  {
    id: 'analyze-doc',
    icon: '📊',
    title: 'Analyze architecture',
    subtitle: 'Evaluate software trade-offs, security, and scalability',
    prompt: 'Analyze the architectural trade-offs between microservices and modular monoliths for a high-traffic system.',
    persona: 'code-engineer',
    model: 'gemini-3.5-flash',
  },
  {
    id: 'research-topic',
    icon: '🔍',
    title: 'Research a topic',
    subtitle: 'Gather deep market insights and technology trends',
    prompt: 'Conduct a deep-dive research summary on the latest multimodal AI models, latency benchmarks, and cost efficiency.',
    persona: 'intelligence-analyst',
    model: 'gemini-3.5-flash',
  },
];

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="empty-state-chatgpt">
      {/* Welcome Hero */}
      <div className="empty-state-center">
        <NexoraLogo size={52} withBackground={true} glow={true} />
        <h1 className="empty-state-main-title">How can I help you today?</h1>
      </div>

      {/* 2x2 Suggestion Cards Grid */}
      <div className="empty-state-cards-grid">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="suggestion-card-chatgpt"
            onClick={() => onSuggestion?.(item.prompt, { model: item.model, persona: item.persona })}
          >
            <div className="suggestion-card-top">
              <span className="suggestion-card-icon">{item.icon}</span>
              <span className="suggestion-card-title">{item.title}</span>
            </div>
            <p className="suggestion-card-desc">{item.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
