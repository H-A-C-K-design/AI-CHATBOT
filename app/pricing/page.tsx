'use client';

// ============================================================
// Pricing Page — Full Standalone Subscription & Plans Route
// ============================================================
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NexoraLogo } from '@/components/ui/nexora-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PricingModal } from '@/components/pricing/pricing-modal';
import { PhonePePaymentModal } from '@/components/pricing/phonepe-payment-modal';
import { usePricing } from '@/components/pricing/pricing-context';

export default function PricingPage() {
  const router = useRouter();
  const { currentPlan, subscription } = usePricing();

  return (
    <div className="pricing-page-wrapper">
      {/* Top Navbar */}
      <header className="pricing-nav">
        <div className="pricing-nav-inner">
          <Link href="/chat" className="pricing-brand-wrap">
            <NexoraLogo size={28} withBackground={true} glow={true} />
            <span className="pricing-brand-name">NEXORA AI</span>
          </Link>

          <div className="pricing-nav-actions">
            <div className="pricing-current-pill">
              <span className="pricing-current-dot" />
              <span>Active Plan: <strong>{currentPlan.toUpperCase()}</strong></span>
            </div>
            <ThemeToggle />
            <button
              onClick={() => router.push('/chat')}
              className="pricing-back-chat-btn"
              type="button"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pricing-main-content">
        <div className="pricing-hero-section">
          <div className="pricing-pill-badge">
            <span>Plans &amp; Subscriptions</span>
          </div>
          <h1 className="pricing-page-title">
            Find the right plan for your intelligence needs
          </h1>
          <p className="pricing-page-sub">
            From everyday exploration to intensive programming and deep frontier reasoning. Instant activation via PhonePe UPI.
          </p>
        </div>

        {/* Pricing Cards Container */}
        <div className="pricing-standalone-cards-wrap">
          <PricingModal isStandalonePage={true} />
        </div>

        {/* FAQ Section */}
        <section className="pricing-faq-section">
          <h2 className="pricing-faq-title">Frequently Asked Questions</h2>
          <div className="pricing-faq-grid">
            <div className="pricing-faq-item">
              <h3 className="pricing-faq-question">How does PhonePe UPI payment work?</h3>
              <p className="pricing-faq-answer">
                When you choose an upgrade plan (Nexora Go, Nexora Plus, or Nexora Pro), an official PhonePe QR code is generated. Scan it directly from your PhonePe, Google Pay, Paytm, or BHIM app to complete the payment to <strong>Durgesh Amol Gaikwad</strong>. Your plan activates immediately upon confirmation.
              </p>
            </div>

            <div className="pricing-faq-item">
              <h3 className="pricing-faq-question">Can I switch plans at any time?</h3>
              <p className="pricing-faq-answer">
                Yes! You can upgrade from Nexora Go to Nexora Plus or Nexora Pro at any time. Simply select the new plan and complete the corresponding UPI QR payment.
              </p>
            </div>

            <div className="pricing-faq-item">
              <h3 className="pricing-faq-question">What frontier models are included in Nexora Plus and Pro?</h3>
              <p className="pricing-faq-answer">
                Nexora Plus includes OpenAI GPT-4o, DeepSeek-R1 reasoning, Google Gemini 3.6 Flash multimodal vision, Auto Smart Router, and the Research Paper Analyzer. Nexora Pro offers 20x higher compute limits, Agent Observability traces &amp; telemetry, Agent Evals &amp; Benchmarks, and 100 GB storage.
              </p>
            </div>

            <div className="pricing-faq-item">
              <h3 className="pricing-faq-question">What if my payment is delayed or need assistance?</h3>
              <p className="pricing-faq-answer">
                Payments via PhonePe QR are processed instantly. You can also enter your UPI Transaction Reference (UTR) number in the checkout modal for instant verification and activation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Embedded PhonePe Payment Modal */}
      <PhonePePaymentModal />

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="pricing-footer-inner">
          <div className="footer-left">
            <NexoraLogo size={20} withBackground={true} />
            <span>© {new Date().getFullYear()} Nexora AI. All rights reserved. PhonePe accepted.</span>
          </div>
          <div className="footer-links">
            <Link href="/chat" className="footer-link">Chat</Link>
            <Link href="/settings" className="footer-link">Settings</Link>
            <Link href="/reports" className="footer-link">Reports</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
