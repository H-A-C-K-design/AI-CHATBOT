'use client';

// ============================================================
// 7-Step Monitoring Project Creation Wizard Component
// Multi-step configuration with dynamic tags and validation
// ============================================================
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import type { CreateProjectInput, MonitoringFrequency, AlertPriority } from '@/types';

export function ProjectWizard() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    industry: '',
    researchTopics: [],
    keywords: [],
    competitors: [],
    patentKeywords: [],
    frequency: 'daily',
    priorityThreshold: 0.75,
    notificationPreferences: {
      email: true,
      inApp: true,
      priorityThreshold: 'high',
    },
  });

  // Tag inputs state
  const [topicInput, setTopicInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [patentKeywordInput, setPatentKeywordInput] = useState('');

  // Add tag handlers
  const handleAddTag = (
    field: 'researchTopics' | 'keywords' | 'competitors' | 'patentKeywords',
    value: string,
    setter: (val: string) => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!formData[field].includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], trimmed],
      }));
    }
    setter('');
  };

  const handleRemoveTag = (
    field: 'researchTopics' | 'keywords' | 'competitors' | 'patentKeywords',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: 'researchTopics' | 'keywords' | 'competitors' | 'patentKeywords',
    value: string,
    setter: (val: string) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(field, value, setter);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Please enter a project name.');
        return false;
      }
      if (!formData.industry.trim()) {
        setError('Please specify an industry or domain.');
        return false;
      }
    }
    if (currentStep === 2 && formData.researchTopics.length === 0) {
      setError('Please add at least one research topic to monitor.');
      return false;
    }
    if (currentStep === 3 && formData.keywords.length === 0) {
      setError('Please add at least one keyword.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(7, prev + 1));
    }
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('You must be logged in.');

      const response = await fetch('/api/intelligence/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create project.');
      }

      // Automatically trigger initial autonomous collection for this project
      const projectId = data.project?.id;
      if (projectId) {
        fetch(`/api/intelligence/projects/${projectId}/run`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      router.push('/intelligence');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    'Basic Information',
    'Research Topics',
    'Keywords & Technology',
    'Competitor Watch',
    'Patent Monitoring',
    'Monitoring Preferences',
    'Review & Confirm',
  ];

  return (
    <div className="wizard-container">
      {/* Progress Header */}
      <div className="wizard-progress-bar">
        <div className="wizard-steps-indicator">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;

            return (
              <div key={title} className={`wizard-step-node ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-active' : ''}`}>
                <div className="wizard-node-circle">{isCompleted ? '✓' : stepNum}</div>
                <span className="wizard-node-label">{title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="wizard-error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="wizard-card">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 1 — Project Information</h2>
            <p className="wizard-step-desc">
              Define the scope and domain for this autonomous intelligence monitoring project.
            </p>

            <div className="wizard-form-group">
              <label htmlFor="proj-name">Project Name *</label>
              <input
                id="proj-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. AI Cybersecurity & Agentic Defense Intelligence"
                className="wizard-input"
                autoFocus
              />
            </div>

            <div className="wizard-form-group">
              <label htmlFor="proj-industry">Industry / Domain *</label>
              <input
                id="proj-industry"
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Cybersecurity, LLM Security, FinTech"
                className="wizard-input"
              />
            </div>

            <div className="wizard-form-group">
              <label htmlFor="proj-desc">Project Objective &amp; Description</label>
              <textarea
                id="proj-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Monitor continuous developments in AI agents, security vulnerabilities, patents, and competitors."
                className="wizard-textarea"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Research Topics */}
        {step === 2 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 2 — Research Topics</h2>
            <p className="wizard-step-desc">
              Specify academic and preprint research topics to continuously track on arXiv and OpenAlex.
            </p>

            <div className="wizard-form-group">
              <label htmlFor="input-topics">Add Research Topic (Press Enter)</label>
              <div className="wizard-input-tag-row">
                <input
                  id="input-topics"
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'researchTopics', topicInput, setTopicInput)}
                  placeholder="e.g. LLM Security, Autonomous Agents, Prompt Injection"
                  className="wizard-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddTag('researchTopics', topicInput, setTopicInput)}
                  className="wizard-tag-add-btn"
                >
                  Add Topic
                </button>
              </div>
            </div>

            <div className="wizard-tags-display">
              {formData.researchTopics.map((t, idx) => (
                <span key={t} className="wizard-chip">
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('researchTopics', idx)}
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.researchTopics.length === 0 && (
                <span className="wizard-chip-placeholder">No research topics added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Keywords */}
        {step === 3 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 3 — Tracking Keywords</h2>
            <p className="wizard-step-desc">
              Target specific terms, concepts, and technical keywords for source matching.
            </p>

            <div className="wizard-form-group">
              <label htmlFor="input-kw">Add Keyword (Press Enter)</label>
              <div className="wizard-input-tag-row">
                <input
                  id="input-kw"
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'keywords', keywordInput, setKeywordInput)}
                  placeholder="e.g. Zero Trust, Threat Detection, Guardrails"
                  className="wizard-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddTag('keywords', keywordInput, setKeywordInput)}
                  className="wizard-tag-add-btn"
                >
                  Add Keyword
                </button>
              </div>
            </div>

            <div className="wizard-tags-display">
              {formData.keywords.map((k, idx) => (
                <span key={k} className="wizard-chip">
                  <span>#{k}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('keywords', idx)}
                    aria-label={`Remove ${k}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.keywords.length === 0 && (
                <span className="wizard-chip-placeholder">No keywords added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Competitors */}
        {step === 4 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 4 — Competitor Watch</h2>
            <p className="wizard-step-desc">
              Enter user-defined competitor organization or product names to monitor (No fake defaults).
            </p>

            <div className="wizard-form-group">
              <label htmlFor="input-comp">Add Competitor Name (Press Enter)</label>
              <div className="wizard-input-tag-row">
                <input
                  id="input-comp"
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'competitors', competitorInput, setCompetitorInput)}
                  placeholder="e.g. CrowdStrike, Palo Alto Networks, OpenAI"
                  className="wizard-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddTag('competitors', competitorInput, setCompetitorInput)}
                  className="wizard-tag-add-btn"
                >
                  Add Competitor
                </button>
              </div>
            </div>

            <div className="wizard-tags-display">
              {formData.competitors.map((c, idx) => (
                <span key={c} className="wizard-chip wizard-chip-comp">
                  <span>🏢 {c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('competitors', idx)}
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.competitors.length === 0 && (
                <span className="wizard-chip-placeholder">No competitors configured. You can also add competitors later.</span>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Patent Monitoring */}
        {step === 5 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 5 — Patent Monitoring</h2>
            <p className="wizard-step-desc">
              Specify technology classes and patent keywords for continuous USPTO and global patent indexing.
            </p>

            <div className="wizard-form-group">
              <label htmlFor="input-patent-kw">Add Patent Keyword (Press Enter)</label>
              <div className="wizard-input-tag-row">
                <input
                  id="input-patent-kw"
                  type="text"
                  value={patentKeywordInput}
                  onChange={(e) => setPatentKeywordInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'patentKeywords', patentKeywordInput, setPatentKeywordInput)}
                  placeholder="e.g. AI Model Security, Adversarial Robustness, Neural Verification"
                  className="wizard-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddTag('patentKeywords', patentKeywordInput, setPatentKeywordInput)}
                  className="wizard-tag-add-btn"
                >
                  Add Patent Keyword
                </button>
              </div>
            </div>

            <div className="wizard-tags-display">
              {formData.patentKeywords.map((pk, idx) => (
                <span key={pk} className="wizard-chip wizard-chip-patent">
                  <span>📜 {pk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag('patentKeywords', idx)}
                    aria-label={`Remove ${pk}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.patentKeywords.length === 0 && (
                <span className="wizard-chip-placeholder">No patent keywords configured.</span>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Preferences */}
        {step === 6 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 6 — Monitoring &amp; Alert Preferences</h2>
            <p className="wizard-step-desc">
              Configure autonomous execution intervals and alert priority thresholds.
            </p>

            <div className="wizard-form-group">
              <label htmlFor="pref-freq">Monitoring Frequency</label>
              <select
                id="pref-freq"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as MonitoringFrequency })}
                className="wizard-select"
              >
                <option value="hourly">Hourly Autonomous Scan</option>
                <option value="six_hourly">Every 6 Hours</option>
                <option value="daily">Daily Schedule (Recommended)</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </div>

            <div className="wizard-form-group">
              <label htmlFor="pref-threshold">
                Priority Scoring Threshold ({(formData.priorityThreshold || 0.75) * 100}%)
              </label>
              <input
                id="pref-threshold"
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={formData.priorityThreshold}
                onChange={(e) => setFormData({ ...formData, priorityThreshold: parseFloat(e.target.value) })}
                className="wizard-slider"
              />
              <span className="wizard-slider-hint">
                Records with impact score above this threshold generate high-priority alerts.
              </span>
            </div>

            <div className="wizard-form-group">
              <label htmlFor="pref-alert-level">Minimum Alert Notification Level</label>
              <select
                id="pref-alert-level"
                value={formData.notificationPreferences?.priorityThreshold || 'high'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notificationPreferences: {
                      ...formData.notificationPreferences!,
                      priorityThreshold: e.target.value as AlertPriority,
                    },
                  })
                }
                className="wizard-select"
              >
                <option value="low">Low &amp; Above (All Updates)</option>
                <option value="medium">Medium &amp; Above</option>
                <option value="high">High &amp; Above (Recommended)</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 7: Review & Confirm */}
        {step === 7 && (
          <div className="wizard-step-body">
            <h2 className="wizard-step-title">Step 7 — Review Configuration</h2>
            <p className="wizard-step-desc">
              Confirm your project configuration before starting autonomous source monitoring.
            </p>

            <div className="wizard-review-summary">
              <div className="review-item">
                <span className="review-label">Project Name:</span>
                <span className="review-val">{formData.name}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Industry:</span>
                <span className="review-val">{formData.industry}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Frequency:</span>
                <span className="review-val capitalize">{formData.frequency}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Research Topics:</span>
                <span className="review-val">
                  {formData.researchTopics.length > 0 ? formData.researchTopics.join(', ') : 'None'}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Keywords:</span>
                <span className="review-val">
                  {formData.keywords.length > 0 ? formData.keywords.join(', ') : 'None'}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Competitors:</span>
                <span className="review-val">
                  {formData.competitors.length > 0 ? formData.competitors.join(', ') : 'None'}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Patent Keywords:</span>
                <span className="review-val">
                  {formData.patentKeywords.length > 0 ? formData.patentKeywords.join(', ') : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="wizard-card-footer">
          {step > 1 && (
            <button onClick={handlePrev} type="button" className="wizard-prev-btn">
              Back
            </button>
          )}
          <div className="wizard-footer-right">
            <button
              onClick={() => router.push('/intelligence')}
              type="button"
              className="wizard-cancel-btn"
            >
              Cancel
            </button>
            {step < 7 ? (
              <button onClick={handleNext} type="button" className="wizard-next-btn">
                Next: {stepTitles[step]} →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
                className="wizard-submit-btn"
              >
                {isSubmitting ? 'Starting Monitoring...' : 'Create & Start Monitoring'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
