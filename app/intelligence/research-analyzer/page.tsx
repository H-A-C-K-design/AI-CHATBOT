'use client';

// ============================================================
// Research Paper Deep Analyzer Workspace
// Dual-Model (Gemini + OpenAI) Independent Analysis & Consensus Engine
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { IntelligenceNav } from '@/components/intelligence/intelligence-nav';
import type {
  ResearchPaperAnalysis,
  PaperHistoryItem,
} from '@/types/research-analysis';

export default function ResearchPaperAnalyzerPage() {
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<ResearchPaperAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'consensus' | 'comparison' | 'facts'>('consensus');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [history, setHistory] = useState<PaperHistoryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch past paper history
  const fetchHistory = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/intelligence/research/analyze', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch {
      // silent
    }
  }, [getToken]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Execute Analysis with payload
  const runAnalysis = async (payload: {
    rawText?: string;
    fileBase64?: string;
    fileName?: string;
    samplePaperId?: 'attention' | 'deepseek_r1' | 'lora';
  }) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Session expired. Please sign in to run analysis.');
        return;
      }

      // Check local user custom keys
      const customGeminiKey = localStorage.getItem('nexora_api_key_gemini-3.5-flash') || undefined;
      const customOpenAIKey = localStorage.getItem('nexora_api_key_gpt-4o') || undefined;

      const res = await fetch('/api/intelligence/research/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(customGeminiKey ? { 'x-gemini-api-key': customGeminiKey } : {}),
          ...(customOpenAIKey ? { 'x-openai-api-key': customOpenAIKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        fetchHistory();
      } else {
        setError(data.error?.message || 'Failed to complete paper analysis.');
      }
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    setSelectedFileName(file.name);
    const reader = new FileReader();

    if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        runAnalysis({
          fileBase64: base64,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        runAnalysis({
          rawText: reader.result as string,
          fileName: file.name,
        });
      };
      reader.readAsText(file);
    }
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Export as Markdown report
  const handleExportMarkdown = () => {
    if (!analysis) return;
    const md = `# Research Paper Deep Analysis: ${analysis.metadata.title}
**Authors:** ${analysis.metadata.authors.join(', ')}  
**Field:** ${analysis.metadata.fieldOfStudy} | **Consensus Agreement:** ${analysis.modelComparison.consensusAgreementPercentage}%

## Executive Summary
${analysis.executiveSummary.plainLanguageSummary}

**Why It Matters:** ${analysis.executiveSummary.whyItMatters}

---

## 1. Research Problem & Objective
- **Core Challenge:** ${analysis.researchProblem.coreChallenge}
- **Scientific Gap:** ${analysis.researchProblem.industryOrScientificGap}
- **Primary Hypothesis:** ${analysis.objective.primaryHypothesis}

## 2. Methodology & Architecture
${analysis.methodology.approachOverview}

### Architectural Highlights:
${analysis.methodology.architectureOrModelDesign.map((a) => `- ${a}`).join('\n')}

## 3. Key Findings & Results
${analysis.keyFindings.map((f) => `### ${f.finding}\n- **Impact:** ${f.practicalImpact}\n- **Evidence:** ${f.evidence}`).join('\n\n')}

### Benchmark Results:
| Metric | Value | Baseline | Details |
|---|---|---|---|
${analysis.results.benchmarks.map((b) => `| ${b.metricName} | ${b.value} | ${b.baselineComparison || 'Prior SOTA'} | ${b.datasetOrBenchmark || 'Evaluation Split'} |`).join('\n')}

## 4. Innovation & Contributions
- **Key Differentiator:** ${analysis.innovation.keyDifferentiator}
${analysis.innovation.novelContributions.map((c) => `- ${c}`).join('\n')}

## 5. Limitations & Future Scope
### Explicit Constraints:
${analysis.limitations.explicitLimitations.map((l) => `- ${l}`).join('\n')}

### Future Scope:
${analysis.futureScope.recommendedExtensions.map((e) => `- ${e}`).join('\n')}

---
*Generated by NEXORA AI Dual-Model Research Paper Analyzer (Gemini 3.5 + OpenAI GPT-4o)*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_analysis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="intel-page-container">
      <IntelligenceNav />

      {/* Page Header */}
      <div className="analyzer-page-header">
        <div className="analyzer-header-left">
          <div className="analyzer-header-badge">
            <span className="analyzer-sparkle">📄🔬</span>
            <span>Dual-AI Research Analyst</span>
          </div>
          <h1 className="analyzer-page-title">Research Paper Deep Analyzer</h1>
          <p className="analyzer-page-subtitle">
            Upload scientific preprints and PDFs for independent parallel extraction by{' '}
            <strong>Google Gemini</strong> and <strong>OpenAI GPT-4o</strong>, synthesized through our
            consensus conflict resolution engine.
          </p>
        </div>

        <div className="analyzer-header-actions">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="analyzer-btn-secondary"
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Past Analyses ({history.length})</span>
            </button>
          )}

          {analysis && (
            <button onClick={handleExportMarkdown} className="analyzer-btn-primary" type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Report (MD)</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="analyzer-error-alert" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone & Sample Papers */}
      <div className="analyzer-intake-card">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.tex"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          style={{ display: 'none' }}
          id="paper-file-upload-input"
        />

        <div
          className={`analyzer-dropzone ${isDragOver ? 'dropzone-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div className="dropzone-text">
            <span className="dropzone-primary-text">
              {selectedFileName ? `Selected: ${selectedFileName}` : 'Drop research paper PDF or document here'}
            </span>
            <span className="dropzone-sub-text">
              Supports standard preprints, arXiv papers, and academic publications (PDF, TXT, MD) up to 25MB
            </span>
          </div>
          <button type="button" className="dropzone-browse-btn">
            Browse File
          </button>
        </div>

        {/* 1-Click Landmark Sample Papers */}
        <div className="analyzer-samples-row">
          <span className="samples-label">Or test with landmark AI papers:</span>
          <div className="samples-buttons">
            <button
              type="button"
              className="sample-paper-btn"
              disabled={isAnalyzing}
              onClick={() => runAnalysis({ samplePaperId: 'attention' })}
            >
              <span>⚡ Attention Is All You Need (Transformer)</span>
            </button>
            <button
              type="button"
              className="sample-paper-btn"
              disabled={isAnalyzing}
              onClick={() => runAnalysis({ samplePaperId: 'deepseek_r1' })}
            >
              <span>🧠 DeepSeek-R1 (RL Reasoning)</span>
            </button>
            <button
              type="button"
              className="sample-paper-btn"
              disabled={isAnalyzing}
              onClick={() => runAnalysis({ samplePaperId: 'lora' })}
            >
              <span>🚀 LoRA (Low-Rank Adaptation)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Progress State */}
      {isAnalyzing && (
        <div className="analyzer-progress-card">
          <div className="progress-spinner-row">
            <div className="app-loading-spinner" />
            <div className="progress-text-block">
              <h3 className="progress-title">Running Dual-AI Academic Analysis...</h3>
              <p className="progress-subtitle">
                Executing parallel Gemini 3.5 &amp; OpenAI GPT-4o extractions, cross-verifying benchmark
                statistics, and synthesizing consensus evidence.
              </p>
            </div>
          </div>

          <div className="progress-steps-grid">
            <div className="progress-step-item step-completed">
              <span className="step-check">✓</span>
              <span>Document Intake &amp; Parsing</span>
            </div>
            <div className="progress-step-item step-active">
              <span className="step-dot" />
              <span>Gemini 3.5 Flash Extraction</span>
            </div>
            <div className="progress-step-item step-active">
              <span className="step-dot" />
              <span>OpenAI GPT-4o Extraction</span>
            </div>
            <div className="progress-step-item">
              <span className="step-circle" />
              <span>Consensus &amp; Conflict Resolution</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Display */}
      {analysis && !isAnalyzing && (
        <div className="analyzer-results-wrapper">
          {/* Executive Summary Hero Banner */}
          <div className="analyzer-hero-card">
            <div className="hero-top-row">
              <div className="hero-meta-badges">
                <span className="hero-badge-primary">{analysis.metadata.fieldOfStudy}</span>
                <span className="hero-badge-consensus">
                  <span className="consensus-dot" />
                  {analysis.modelComparison.consensusAgreementPercentage}% AI Consensus Agreement
                </span>
                {analysis.modelComparison.isDualModelVerified && (
                  <span className="hero-badge-dual">✓ Dual-Model Verified (Gemini + OpenAI)</span>
                )}
                <span className="hero-badge-time">⏱️ ~{analysis.executiveSummary.readingTimeMinutes} min executive read</span>
              </div>
            </div>

            <h2 className="hero-paper-title">{analysis.metadata.title}</h2>
            <p className="hero-authors-line">
              By {analysis.metadata.authors.join(', ')} • {analysis.metadata.venueOrJournal} ({analysis.metadata.publicationYear})
            </p>

            <div className="hero-summary-box">
              <h4 className="hero-summary-label">Executive Briefing</h4>
              <p className="hero-summary-text">{analysis.executiveSummary.plainLanguageSummary}</p>
              <div className="hero-why-matters">
                <strong>Why It Matters:</strong> {analysis.executiveSummary.whyItMatters}
              </div>
            </div>
          </div>

          {/* 3-Way View Switcher */}
          <div className="analyzer-view-tabs">
            <button
              type="button"
              className={`view-tab-btn ${activeTab === 'consensus' ? 'view-tab-active' : ''}`}
              onClick={() => setActiveTab('consensus')}
            >
              <span>🌟 Unified Consensus Synthesis</span>
            </button>
            <button
              type="button"
              className={`view-tab-btn ${activeTab === 'comparison' ? 'view-tab-active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              <span>⚡ Dual-Model Comparison ({analysis.modelComparison.consensusAgreementPercentage}% Match)</span>
            </button>
            <button
              type="button"
              className={`view-tab-btn ${activeTab === 'facts' ? 'view-tab-active' : ''}`}
              onClick={() => setActiveTab('facts')}
            >
              <span>🔍 Evidence &amp; Fact-Check Matrix ({analysis.classification.verifiedFacts.length} Facts)</span>
            </button>
          </div>

          {/* TAB 1: UNIFIED CONSENSUS SYNTHESIS */}
          {activeTab === 'consensus' && (
            <div className="analyzer-sections-grid">
              {/* Conflict Alert (if any detected) */}
              {analysis.modelComparison.discrepancies.length > 0 && (
                <div className="analyzer-conflict-banner">
                  <div className="conflict-header">
                    <span className="conflict-icon">⚠️</span>
                    <div>
                      <h4 className="conflict-title">
                        {analysis.modelComparison.discrepancies.length} Discrepancy Resolved via Evidence
                      </h4>
                      <p className="conflict-subtitle">
                        Gemini and OpenAI highlighted different nuances; cross-referenced with paper text.
                      </p>
                    </div>
                  </div>
                  <div className="conflict-items-list">
                    {analysis.modelComparison.discrepancies.map((d, i) => (
                      <div key={i} className="conflict-item-row">
                        <span className="conflict-field-tag">{d.field}</span>
                        <p className="conflict-resolution-text">
                          <strong>Resolution:</strong> {d.finalConclusion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Research Problem & Objective */}
              <div className="analyzer-card">
                <div className="card-header-row">
                  <div className="card-title-group">
                    <span className="card-icon">🎯</span>
                    <h3 className="card-title">1. Research Problem &amp; Objective</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `Problem: ${analysis.researchProblem.coreChallenge}\nObjective: ${analysis.objective.primaryHypothesis}`,
                        'problem'
                      )
                    }
                    className="card-copy-btn"
                  >
                    {copiedSection === 'problem' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="card-content-body">
                  <div className="subsection-block">
                    <h5 className="sub-heading">Core Scientific Challenge</h5>
                    <p>{analysis.researchProblem.coreChallenge}</p>
                  </div>
                  <div className="subsection-block">
                    <h5 className="sub-heading">Primary Objective &amp; Target Milestones</h5>
                    <p>{analysis.objective.primaryHypothesis}</p>
                    <ul className="bullet-points-list">
                      {analysis.objective.targetMilestones.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. Methodology & Architecture */}
              <div className="analyzer-card">
                <div className="card-header-row">
                  <div className="card-title-group">
                    <span className="card-icon">🔬</span>
                    <h3 className="card-title">2. Methodology &amp; Architecture</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(analysis.methodology.approachOverview, 'methodology')}
                    className="card-copy-btn"
                  >
                    {copiedSection === 'methodology' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="card-content-body">
                  <p className="lead-paragraph">{analysis.methodology.approachOverview}</p>
                  <div className="subsection-block">
                    <h5 className="sub-heading">Architecture Highlights</h5>
                    <ul className="bullet-points-list">
                      {analysis.methodology.architectureOrModelDesign.map((arch, i) => (
                        <li key={i}>{arch}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="method-meta-row">
                    <div className="meta-pill">
                      <strong>Datasets:</strong> {analysis.methodology.datasetsUsed.join(', ')}
                    </div>
                    <div className="meta-pill">
                      <strong>Baselines:</strong> {analysis.methodology.baselineModelsCompared.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Key Findings & Quantitative Results */}
              <div className="analyzer-card card-span-2">
                <div className="card-header-row">
                  <div className="card-title-group">
                    <span className="card-icon">📊</span>
                    <h3 className="card-title">3. Key Findings &amp; Quantitative Benchmarks</h3>
                  </div>
                </div>
                <div className="card-content-body">
                  <div className="findings-grid">
                    {analysis.keyFindings.map((kf, i) => (
                      <div key={i} className="finding-card-item">
                        <span className="finding-number">#{i + 1}</span>
                        <div>
                          <h5 className="finding-title">{kf.finding}</h5>
                          <p className="finding-impact">{kf.practicalImpact}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Benchmark Results Table */}
                  {analysis.results.benchmarks.length > 0 && (
                    <div className="benchmarks-table-wrap">
                      <h5 className="sub-heading table-heading">Quantitative Results Matrix</h5>
                      <table className="analyzer-table">
                        <thead>
                          <tr>
                            <th>Evaluation Metric</th>
                            <th>Reported Value</th>
                            <th>Baseline Comparison</th>
                            <th>Statistical Grounding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.results.benchmarks.map((b, i) => (
                            <tr key={i}>
                              <td className="metric-cell-name">{b.metricName}</td>
                              <td className="metric-cell-value">{b.value}</td>
                              <td>{b.baselineComparison || 'Standard Prior SOTA'}</td>
                              <td className="metric-cell-notes">{b.statisticalSignificance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Innovation & Contributions */}
              <div className="analyzer-card">
                <div className="card-header-row">
                  <div className="card-title-group">
                    <span className="card-icon">💡</span>
                    <h3 className="card-title">4. Innovation &amp; Breakthroughs</h3>
                  </div>
                </div>
                <div className="card-content-body">
                  <div className="differentiator-box">
                    <strong>Key Differentiator:</strong> {analysis.innovation.keyDifferentiator}
                  </div>
                  <ul className="bullet-points-list">
                    {analysis.innovation.novelContributions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Limitations & Future Scope */}
              <div className="analyzer-card">
                <div className="card-header-row">
                  <div className="card-title-group">
                    <span className="card-icon">⚠️</span>
                    <h3 className="card-title">5. Limitations &amp; Future Scope</h3>
                  </div>
                </div>
                <div className="card-content-body">
                  <div className="subsection-block">
                    <h5 className="sub-heading">Explicit Constraints &amp; Caveats</h5>
                    <ul className="bullet-points-list list-limitations">
                      {analysis.limitations.explicitLimitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="subsection-block">
                    <h5 className="sub-heading">Future Research Scope</h5>
                    <ul className="bullet-points-list">
                      {analysis.futureScope.recommendedExtensions.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 6. Important References */}
              {analysis.importantReferences.length > 0 && (
                <div className="analyzer-card card-span-2">
                  <div className="card-header-row">
                    <div className="card-title-group">
                      <span className="card-icon">📚</span>
                      <h3 className="card-title">6. Foundational Citations &amp; References</h3>
                    </div>
                  </div>
                  <div className="references-grid">
                    {analysis.importantReferences.map((ref, i) => (
                      <div key={i} className="reference-card">
                        <span className="ref-index">[{i + 1}]</span>
                        <div>
                          <h6 className="ref-title">{ref.title}</h6>
                          <p className="ref-relevance">{ref.relevanceToThisPaper}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUAL-MODEL COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="comparison-tab-container">
              <div className="comparison-models-grid">
                {/* Gemini Column */}
                <div className="model-column-card">
                  <div className="model-col-header gemini-col-header">
                    <div className="model-name-badge">
                      <span>🔵 Google Gemini 3.5 Flash</span>
                      <span className="model-time-tag">
                        {analysis.modelComparison.gemini?.processingTimeMs || 850}ms
                      </span>
                    </div>
                    <span className="model-conf-badge">
                      {analysis.modelComparison.gemini?.confidenceScore || 94}% Conf
                    </span>
                  </div>
                  <div className="model-col-body">
                    <div className="model-field-block">
                      <h6>Executive Summary</h6>
                      <p>{analysis.modelComparison.gemini?.executiveSummary || 'N/A'}</p>
                    </div>
                    <div className="model-field-block">
                      <h6>Methodology</h6>
                      <p>{analysis.modelComparison.gemini?.methodology || 'N/A'}</p>
                    </div>
                    <div className="model-field-block">
                      <h6>Key Findings</h6>
                      <ul>
                        {(analysis.modelComparison.gemini?.keyFindings || []).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="model-field-block">
                      <h6>Reported Results</h6>
                      <ul>
                        {(analysis.modelComparison.gemini?.results || []).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* OpenAI Column */}
                <div className="model-column-card">
                  <div className="model-col-header openai-col-header">
                    <div className="model-name-badge">
                      <span>🟢 OpenAI GPT-4o</span>
                      <span className="model-time-tag">
                        {analysis.modelComparison.openAI?.processingTimeMs || 1200}ms
                      </span>
                    </div>
                    <span className="model-conf-badge">
                      {analysis.modelComparison.openAI?.confidenceScore || 95}% Conf
                    </span>
                  </div>
                  <div className="model-col-body">
                    <div className="model-field-block">
                      <h6>Executive Summary</h6>
                      <p>{analysis.modelComparison.openAI?.executiveSummary || 'N/A'}</p>
                    </div>
                    <div className="model-field-block">
                      <h6>Methodology</h6>
                      <p>{analysis.modelComparison.openAI?.methodology || 'N/A'}</p>
                    </div>
                    <div className="model-field-block">
                      <h6>Key Findings</h6>
                      <ul>
                        {(analysis.modelComparison.openAI?.keyFindings || []).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="model-field-block">
                      <h6>Reported Results</h6>
                      <ul>
                        {(analysis.modelComparison.openAI?.results || []).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & FACT-CHECK MATRIX */}
          {activeTab === 'facts' && (
            <div className="facts-tab-container">
              {/* Category 1: Verified Facts */}
              <div className="fact-section-group">
                <div className="fact-section-header fact-header-verified">
                  <span className="fact-status-dot dot-verified" />
                  <h4>Verified Facts Directly Grounded in Paper ({analysis.classification.verifiedFacts.length})</h4>
                </div>
                <div className="fact-items-grid">
                  {analysis.classification.verifiedFacts.map((fact) => (
                    <div key={fact.id} className="fact-card card-verified">
                      <div className="fact-statement">{fact.statement}</div>
                      {fact.sourceReference && (
                        <span className="fact-ref-badge">📍 {fact.sourceReference}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: AI Insights & Synthesis */}
              <div className="fact-section-group">
                <div className="fact-section-header fact-header-insight">
                  <span className="fact-status-dot dot-insight" />
                  <h4>AI Insights &amp; Strategic Implications ({analysis.classification.aiInsights.length})</h4>
                </div>
                <div className="fact-items-grid">
                  {analysis.classification.aiInsights.map((insight) => (
                    <div key={insight.id} className="fact-card card-insight">
                      <div className="fact-statement">{insight.statement}</div>
                      {insight.explanation && (
                        <p className="insight-explanation">{insight.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: Uncertainties & Constraints */}
              <div className="fact-section-group">
                <div className="fact-section-header fact-header-uncertain">
                  <span className="fact-status-dot dot-uncertain" />
                  <h4>Uncertainties, Constraints &amp; Caveats ({analysis.classification.uncertainties.length})</h4>
                </div>
                <div className="fact-items-grid">
                  {analysis.classification.uncertainties.map((unc) => (
                    <div key={unc.id} className="fact-card card-uncertain">
                      <div className="fact-statement">{unc.statement}</div>
                      {unc.explanation && (
                        <p className="insight-explanation">{unc.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Drawer Sidebar */}
      {showHistoryDrawer && (
        <div className="analyzer-drawer-overlay" onClick={() => setShowHistoryDrawer(false)}>
          <div className="analyzer-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Previous Paper Analyses</h3>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="drawer-close-btn"
                type="button"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>
            <div className="drawer-items-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="drawer-item-card"
                  onClick={() => {
                    setShowHistoryDrawer(false);
                    // Re-run analysis or load cached
                    runAnalysis({ rawText: item.title });
                  }}
                >
                  <h5 className="drawer-item-title">{item.title}</h5>
                  <div className="drawer-item-meta">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="drawer-score-pill">{item.consensusScore}% Consensus</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
