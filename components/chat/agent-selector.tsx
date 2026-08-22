'use client';

// ============================================================
// Multi-Agent Selector — Toolbar for Agent Switching & Swarm Mode
// ============================================================
import React from 'react';
import type { AgentMode } from '@/types';

interface AgentSelectorProps {
  currentMode: AgentMode;
  onSelectMode: (mode: AgentMode) => void;
  disabled?: boolean;
}

const AGENT_OPTIONS: Array<{
  id: AgentMode;
  name: string;
  icon: string;
  description: string;
  badge?: string;
}> = [
  {
    id: 'swarm',
    name: 'Multi-Agent Swarm',
    icon: '⚡',
    description: '4 Agents collaborate: Orchestrator ➔ Research ➔ Code ➔ Security Critic',
    badge: 'Recommended',
  },
  {
    id: 'lead-orchestrator',
    name: 'Lead Orchestrator',
    icon: '🧠',
    description: 'Workflow planning, task breakdown & unified synthesis',
  },
  {
    id: 'research-analyst',
    name: 'Research Analyst',
    icon: '🔬',
    description: 'Deep intelligence, arXiv papers, patents & competitor benchmarks',
  },
  {
    id: 'code-engineer',
    name: 'Code Engineer',
    icon: '💻',
    description: 'Systems architecture, typed implementations & algorithms',
  },
  {
    id: 'security-critic',
    name: 'Security Critic',
    icon: '🛡️',
    description: 'OWASP vulnerability checks, code review & quality audit',
  },
];

export function AgentSelector({
  currentMode,
  onSelectMode,
  disabled,
}: AgentSelectorProps) {
  return (
    <div className="agent-selector-toolbar flex items-center gap-1.5 overflow-x-auto py-1 px-1 mb-2 scrollbar-none">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mr-1 select-none flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Agent:
      </span>

      {AGENT_OPTIONS.map((opt) => {
        const isSelected = currentMode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(opt.id)}
            title={opt.description}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
              isSelected
                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-900/30 scale-[1.02]'
                : 'bg-zinc-800/60 text-zinc-300 border-white/10 hover:bg-zinc-700/60 hover:text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{opt.icon}</span>
            <span>{opt.name}</span>
            {opt.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-violet-400 text-violet-950 font-bold' : 'bg-violet-500/20 text-violet-300'
              }`}>
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
