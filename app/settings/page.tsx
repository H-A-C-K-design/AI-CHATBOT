'use client';

// ============================================================
// Settings Page — Multi-AI Engine Configuration & Custom API Keys
// ============================================================
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AI_MODELS, AI_PERSONAS } from '@/lib/ai/models';
import type { AIModelId, AIPersonaId } from '@/types';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Model Preferences State
  const [defaultModel, setDefaultModel] = useState<AIModelId>('gemini-3.5-flash');
  const [defaultPersona, setDefaultPersona] = useState<AIPersonaId>('general-assistant');
  const [temperature, setTemperature] = useState<number>(0.7);

  // Custom API Keys State
  const [geminiKey, setGeminiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load stored preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedModel = localStorage.getItem('nexora_default_model') as AIModelId;
      if (storedModel) setDefaultModel(storedModel);

      const storedPersona = localStorage.getItem('nexora_default_persona') as AIPersonaId;
      if (storedPersona) setDefaultPersona(storedPersona);

      const storedTemp = localStorage.getItem('nexora_temperature');
      if (storedTemp) setTemperature(parseFloat(storedTemp));

      setGeminiKey(localStorage.getItem('nexora_api_key_gemini-3.6-flash') || '');
      setOpenAiKey(localStorage.getItem('nexora_api_key_gpt-4o') || '');
      setDeepseekKey(localStorage.getItem('nexora_api_key_deepseek-r1') || '');
      setClaudeKey(localStorage.getItem('nexora_api_key_claude-3-5-sonnet') || '');
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('nexora_default_model', defaultModel);
    localStorage.setItem('nexora_default_persona', defaultPersona);
    localStorage.setItem('nexora_temperature', temperature.toString());

    if (geminiKey.trim()) localStorage.setItem('nexora_api_key_gemini-3.6-flash', geminiKey.trim());
    else localStorage.removeItem('nexora_api_key_gemini-3.6-flash');

    if (openAiKey.trim()) localStorage.setItem('nexora_api_key_gpt-4o', openAiKey.trim());
    else localStorage.removeItem('nexora_api_key_gpt-4o');

    if (deepseekKey.trim()) localStorage.setItem('nexora_api_key_deepseek-r1', deepseekKey.trim());
    else localStorage.removeItem('nexora_api_key_deepseek-r1');

    if (claudeKey.trim()) localStorage.setItem('nexora_api_key_claude-3-5-sonnet', claudeKey.trim());
    else localStorage.removeItem('nexora_api_key_claude-3-5-sonnet');

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      // Silent fail
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const provider = user.providerData?.[0]?.providerId || 'Unknown';
  const providerName =
    provider === 'google.com'
      ? 'Google'
      : provider === 'github.com'
        ? 'GitHub'
        : provider;

  return (
    <main className="settings-page">
      <div className="settings-container">
        <button
          onClick={() => router.push('/chat')}
          className="settings-back-btn"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to chat</span>
        </button>

        <h1 className="settings-title">Settings & Multi-AI Config</h1>

        {/* 1. Multi-AI Model Configuration */}
        <section className="settings-section">
          <h2 className="settings-section-title">AI Engine & Model Preferences</h2>
          <div className="settings-card">
            <div className="settings-field">
              <label className="settings-field-label" htmlFor="default-model-select">
                Default AI Model
              </label>
              <p className="settings-field-description">
                Primary model used for new conversations
              </p>
              <select
                id="default-model-select"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value as AIModelId)}
                className="settings-select"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) — {m.badge}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-field-label" htmlFor="default-persona-select">
                Default Persona
              </label>
              <p className="settings-field-description">
                Default personality & role instructions
              </p>
              <select
                id="default-persona-select"
                value={defaultPersona}
                onChange={(e) => setDefaultPersona(e.target.value as AIPersonaId)}
                className="settings-select"
              >
                {AI_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <div className="flex-between">
                <label className="settings-field-label" htmlFor="temp-slider">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <span className="settings-field-tag">
                  {temperature < 0.4 ? 'Precise & Deterministic' : temperature > 0.8 ? 'Creative & Expressive' : 'Balanced'}
                </span>
              </div>
              <input
                id="temp-slider"
                type="range"
                min="0"
                max="1.2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="settings-slider"
              />
            </div>
          </div>
        </section>

        {/* 2. Custom API Keys */}
        <section className="settings-section">
          <div className="flex-between">
            <h2 className="settings-section-title">Custom API Keys (Optional)</h2>
            <button
              type="button"
              className="key-toggle-btn"
              onClick={() => setShowKeys(!showKeys)}
            >
              {showKeys ? 'Hide Keys' : 'Show Keys'}
            </button>
          </div>
          <div className="settings-card">
            <p className="settings-card-info">
              The server includes active Gemini 3.6 Flash. You can optionally add your own OpenAI, DeepSeek, or Anthropic keys stored securely in your browser.
            </p>

            <div className="settings-field">
              <label className="settings-field-label">Google Gemini API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field">
              <label className="settings-field-label">OpenAI API Key (ChatGPT / GPT-4o)</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field">
              <label className="settings-field-label">DeepSeek API Key (DeepSeek-R1)</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field">
              <label className="settings-field-label">Anthropic Claude API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="settings-input"
              />
            </div>

            <button
              type="button"
              className="settings-save-btn"
              onClick={handleSaveSettings}
            >
              {saveSuccess ? '✓ Saved Successfully!' : 'Save Preferences'}
            </button>
          </div>
        </section>

        {/* 3. Profile Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-card">
            <div className="settings-profile">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="settings-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="settings-avatar-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="settings-profile-info">
                <h3 className="settings-profile-name">{user.displayName || 'User'}</h3>
                <p className="settings-profile-email">{user.email}</p>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Authentication provider</span>
              <span className="settings-field-value settings-provider-badge">
                {providerName}
              </span>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Account ID</span>
              <span className="settings-field-value settings-uid">{user.uid}</span>
            </div>
          </div>
        </section>

        {/* 4. Appearance Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-card">
            <div className="settings-field settings-field-row">
              <div>
                <span className="settings-field-label">Theme</span>
                <span className="settings-field-description">Switch between dark and light mode</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* 5. Account Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-card">
            <button
              onClick={handleSignOut}
              className="settings-signout-btn"
              type="button"
              id="btn-signout"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H6M6 8H14M14 8L11 5M14 8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
