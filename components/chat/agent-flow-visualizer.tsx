'use client';

// ============================================================
// Multi-Agent Flow Visualizer — Enterprise Collaboration Trace
// Clean SVG iconography, micro-animations & expandable audit logs
// ============================================================
import React, { useState } from 'react';
import type { AgentStep, AgentId } from '@/types';

interface AgentFlowVisualizerProps {
  steps?: AgentStep[];
}

const AGENT_CONFIGS: Record<
  AgentId,
  {
    name: string;
    tagClass: string;
    icon: React.ReactNode;
  }
> = {
  'lead-orchestrator': {
    name: 'Lead Orchestrator',
    tagClass: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  'research-analyst': {
    name: 'Research Analyst',
    tagClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  'code-engineer': {
    name: 'Code Engineer',
    tagClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  'security-critic': {
    name: 'Security Critic',
    tagClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
};

export function AgentFlowVisualizer({ steps }: AgentFlowVisualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);

  if (!steps || steps.length === 0) return null;

  const totalDuration = steps.reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div className="agent-flow-container my-3 rounded-xl border border-white/10 bg-zinc-950/60 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-sm">
      {/* Header Pill & Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-violet-950/20 via-zinc-900/40 to-slate-950/20 hover:bg-white/[0.03] transition text-left cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25">
            <svg className="w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
            </svg>
            <span>Multi-Agent Swarm</span>
          </div>

          <span className="text-xs text-zinc-400 hidden sm:inline">
            {steps.length} Specialized Agents Collaborated
          </span>

          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded">
            {(totalDuration / 1000).toFixed(2)}s
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span>{isOpen ? 'Collapse Trace' : 'View Agent Trace'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Summary Mini Pipeline (Always Visible) */}
      <div className="px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-black/20 text-xs scrollbar-none">
        {steps.map((step, idx) => {
          const config = AGENT_CONFIGS[step.agentId] || {
            name: step.agentName,
            tagClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
            icon: <span className="w-2 h-2 rounded-full bg-zinc-400" />,
          };
          const isSelected = selectedStepIdx === idx;

          return (
            <React.Fragment key={idx}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setSelectedStepIdx(isSelected ? null : idx);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition cursor-pointer ${
                  config.tagClass
                } ${isSelected ? 'ring-2 ring-violet-400 font-semibold shadow-md' : 'opacity-85 hover:opacity-100'}`}
                title={`Inspect ${step.agentName}`}
              >
                <span>{config.icon}</span>
                <span className="font-medium">{config.name}</span>
                <span className="text-[10px] opacity-70 font-mono">({step.durationMs}ms)</span>
              </button>

              {idx < steps.length - 1 && (
                <svg className="w-3 h-3 text-zinc-600 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expandable Collaboration Trace Detail */}
      {isOpen && (
        <div className="p-3.5 border-t border-white/10 space-y-3 bg-zinc-950/80">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between pb-1 border-b border-white/[0.06]">
            <span>Inter-Agent Communication &amp; Delegation Trace</span>
            <span className="text-[11px] text-zinc-500 font-mono">Consensus Pipeline</span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const config = AGENT_CONFIGS[step.agentId] || {
                name: step.agentName,
                tagClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                icon: <span className="w-2 h-2 rounded-full bg-zinc-400" />,
              };
              const isSelected = selectedStepIdx === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 transition ${
                    isSelected
                      ? 'border-violet-500/50 bg-violet-950/20'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white/[0.06] text-zinc-200">
                        {config.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {step.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">{step.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {step.durationMs}ms
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 font-mono bg-black/40 p-2.5 rounded-lg border border-white/[0.06] overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {step.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
