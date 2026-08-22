'use client';

// ============================================================
// New Monitoring Project Page — 7-Step Wizard
// ============================================================
import React from 'react';
import Link from 'next/link';
import { ProjectWizard } from '@/components/intelligence/project-wizard';

export default function NewProjectPage() {
  return (
    <div className="intel-page-container">
      <div className="wizard-page-header">
        <Link href="/projects" className="wizard-back-link">
          ← Back to Projects
        </Link>
        <h1 className="wizard-main-title">Create Autonomous Monitoring Project</h1>
        <p className="wizard-main-subtitle">
          Configure multi-source surveillance across research preprints, patent registries, competitor activity, and industry news.
        </p>
      </div>

      <ProjectWizard />
    </div>
  );
}
