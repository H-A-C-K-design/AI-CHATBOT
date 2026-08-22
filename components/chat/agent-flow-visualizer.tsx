'use client';

// ============================================================
// Multi-Agent Flow Visualizer — Interactive Step & Orchestration Trace
// Renders agent-to-agent collaboration pipeline, timings, and thoughts
// ============================================================
import React, { useState } from 'react';
import type { AgentStep, AgentId } from '@/types';

interface AgentFlowVisualizerProps {
  steps?: AgentStep[];
}

const AGENT_BADGES: Record<
  AgentId,
  { icon: string; name: string; tagClass: string; borderClass: string }
> = {
  'lead-orchestrator': {
    icon: '⚡',
    name: 'Lead Orchestrator',
    tagClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderClass: 'border-purple-500/20',
  },
  'research-analyst': {
    icon: '🔬',
    name: 'Research Analyst',
    tagClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderClass: 'border-emerald-500/20',
  },
  'code-engineer': {
    icon: '💻',
    name: 'Code Engineer',
    tagClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderClass: 'border-blue-500/20',
  },
  'security-critic': {
    icon: '🛡️',
    name: 'Security Critic',
    tagClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500/20',
  },
};

export function AgentFlowVisualizer({ steps }: AgentFlowVisualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number | null>(null);

  if (!steps || steps.length === 0) return null;

  const totalDuration = steps.reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div className="agent-flow-container my-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-300">
      {/* Header Pill & Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-violet-950/30 via-slate-900/40 to-cyan-950/30 hover:bg-white/[0.04] transition text-left cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <span className="animate-pulse">⚡</span>
            <span>Multi-Agent Swarm</span>
          </div>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            {steps.length} Specialized Agents Collaborated
          </span>

          <span className="text-xs font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-md">
            {(totalDuration / 1000).toFixed(2)}s
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <span>{isOpen ? 'Hide Chain' : 'View Collaboration Trace'}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Summary Mini Pipeline (Always Visible) */}
      <div className="px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-black/20 text-xs">
        {steps.map((step, idx) => {
          const badge = AGENT_BADGES[step.agentId] || {
            icon: '🤖',
            name: step.agentName,
            tagClass: 'bg-zinc-800 text-zinc-300',
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
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs whitespace-nowrap transition cursor-pointer ${
                  badge.tagClass
                } ${isSelected ? 'ring-2 ring-violet-400 font-bold shadow-lg' : 'opacity-85 hover:opacity-100'}`}
                title={`Click to inspect ${step.agentName}`}
              >
                <span>{badge.icon}</span>
                <span className="font-medium">{badge.name}</span>
                <span className="text-[10px] opacity-70">({step.durationMs}ms)</span>
              </button>

              {idx < steps.length - 1 && (
                <span className="text-zinc-600 font-mono text-xs select-none">➔</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expandable Collaboration Trace Detail */}
      {isOpen && (
        <div className="p-3.5 border-t border-white/10 space-y-3 bg-zinc-950/60">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between pb-1 border-b border-white/[0.06]">
            <span>Inter-Agent Communication & Delegation Trace</span>
            <span className="text-[11px] text-zinc-500">Autonomous Pipeline Flow</span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const badge = AGENT_BADGES[step.agentId] || {
                icon: '🤖',
                name: step.agentName,
                tagClass: 'bg-zinc-800 text-zinc-300',
              };
              const isSelected = selectedStepIdx === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 transition ${
                    isSelected
                      ? 'border-violet-500/50 bg-violet-950/20'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{badge.icon}</span>
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
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Verified
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-zinc-300 font-mono bg-black/40 p-2.5 rounded-md border border-white/[0.06] overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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
