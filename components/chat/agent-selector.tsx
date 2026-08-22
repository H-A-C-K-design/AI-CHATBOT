'use client';

// ============================================================
// Multi-Agent Selector — Enterprise-Grade Agent Switching
// Clean SVG iconography, smooth transitions & responsive popover
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import type { AgentMode } from '@/types';

interface AgentSelectorProps {
  currentMode: AgentMode;
  onSelectMode: (mode: AgentMode) => void;
  disabled?: boolean;
}

interface AgentOption {
  id: AgentMode;
  name: string;
  shortName: string;
  role: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
}

const AGENT_OPTIONS: AgentOption[] = [
  {
    id: 'swarm',
    name: 'Multi-Agent Swarm',
    shortName: 'Swarm Orchestration',
    role: 'Autonomous 4-Agent Pipeline',
    description: 'Lead Orchestrator ➔ Deep Research ➔ Code Architecture ➔ Security Audit',
    badge: 'Enterprise',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: 'lead-orchestrator',
    name: 'Lead Orchestrator',
    shortName: 'Orchestrator',
    role: 'Decomposition & Synthesis',
    description: 'Goal deconstruction, multi-agent delegation & consolidated consensus',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: 'research-analyst',
    name: 'Research Analyst',
    shortName: 'Research Agent',
    role: 'Academic & Market Intel',
    description: 'Literature grounding (arXiv, OpenAlex), patents & competitor data',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    id: 'code-engineer',
    name: 'Code Engineer',
    shortName: 'Code Architect',
    role: 'Systems & Implementation',
    description: 'Type-safe production code, algorithmic design & modular architectures',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'security-critic',
    name: 'Security Critic',
    shortName: 'Security Auditor',
    role: 'OWASP & Logic Verification',
    description: 'Vulnerability audits, hallucination checks & safety compliance',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
];

export function AgentSelector({
  currentMode,
  onSelectMode,
  disabled,
}: AgentSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    AGENT_OPTIONS.find((opt) => opt.id === currentMode) || AGENT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="agent-selector-container mb-2 relative" ref={dropdownRef}>
      {/* Desktop / Tablet Segmented Pill Bar */}
      <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-md overflow-x-auto scrollbar-none shadow-sm">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 select-none border-r border-white/[0.08] mr-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span>Pipeline:</span>
        </div>

        {AGENT_OPTIONS.map((opt) => {
          const isSelected = currentMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(opt.id)}
              title={`${opt.name}: ${opt.description}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                isSelected
                  ? 'bg-violet-600/90 text-white font-semibold shadow-sm border border-violet-400/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={isSelected ? 'text-white' : 'text-zinc-400'}>
                {opt.icon}
              </span>
              <span>{opt.name}</span>
              {opt.badge && isSelected && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-400/20 text-violet-200 border border-violet-300/30">
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Compact Dropdown Trigger */}
      <div className="sm:hidden flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-xs text-zinc-200 font-medium cursor-pointer shadow-sm hover:bg-zinc-850 transition"
        >
          <span className="text-violet-400">{selectedOption.icon}</span>
          <span className="font-semibold">{selectedOption.name}</span>
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        <span className="text-[11px] text-zinc-400 font-mono">
          {selectedOption.role}
        </span>
      </div>

      {/* Mobile Popover Menu */}
      {dropdownOpen && (
        <div className="sm:hidden absolute bottom-full mb-1 left-0 right-0 z-50 p-1.5 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl space-y-1">
          {AGENT_OPTIONS.map((opt) => {
            const isSelected = currentMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectMode(opt.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold'
                    : 'text-zinc-300 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={isSelected ? 'text-violet-400' : 'text-zinc-400'}>
                    {opt.icon}
                  </span>
                  <div>
                    <div>{opt.name}</div>
                    <div className="text-[10px] text-zinc-500">{opt.role}</div>
                  </div>
                </div>

                {isSelected && (
                  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.5 4.5L6 12L2.5 8.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
