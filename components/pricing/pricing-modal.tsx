'use client';

// ============================================================
// Pricing & Upgrade Modal Component
// Faithful recreation of ChatGPT Plans & Tier Comparison
// Free (₹0), Go (₹399), Plus (₹1,999), Pro (₹10,699)
// ============================================================
import React, { useState, useEffect } from 'react';
import { usePricing, PERSONAL_PLANS, BUSINESS_PLANS } from './pricing-context';
import type { PlanTier, PlanCategory } from '@/types';

interface PricingModalProps {
  isStandalonePage?: boolean;
}

export function PricingModal({ isStandalonePage = false }: PricingModalProps) {
  const {
    isPricingModalOpen,
    closePricingModal,
    openPaymentModal,
    currentPlan,
    resetToFree,
  } = usePricing();

  const [category, setCategory] = useState<PlanCategory>('personal');

  // Handle escape key
  useEffect(() => {
    if (isStandalonePage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPricingModalOpen) {
        closePricingModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPricingModalOpen, closePricingModal, isStandalonePage]);

  if (!isStandalonePage && !isPricingModalOpen) return null;

  const plans = category === 'personal' ? PERSONAL_PLANS : BUSINESS_PLANS;

  const handlePlanAction = (plan: PlanTier) => {
    if (plan.id === currentPlan) {
      return; // already active
    }
    if (plan.id === 'free') {
      resetToFree();
      if (!isStandalonePage) closePricingModal();
      return;
    }
    // Open PhonePe Payment Modal
    if (!isStandalonePage) closePricingModal();
    openPaymentModal(plan);
  };

  const content = (
    <div className={`pricing-dialog-container ${isStandalonePage ? 'pricing-standalone-view' : ''}`}>
      {/* Close button for modal */}
      {!isStandalonePage && (
        <button
          onClick={closePricingModal}
          className="pricing-modal-close-btn"
          type="button"
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Modal Header */}
      <div className="pricing-modal-header">
        <span className="pricing-find-fit-label">Find your best fit &gt;</span>

        {/* Tab Toggle: Personal vs Business */}
        <div className="pricing-tab-toggle" role="tablist" aria-label="Plan category">
          <button
            onClick={() => setCategory('personal')}
            className={`pricing-tab-btn ${category === 'personal' ? 'pricing-tab-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={category === 'personal'}
          >
            Personal
          </button>
          <button
            onClick={() => setCategory('business')}
            className={`pricing-tab-btn ${category === 'business' ? 'pricing-tab-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={category === 'business'}
          >
            Business
          </button>
        </div>
      </div>

      {/* 4 Plans Grid */}
      <div className={`pricing-cards-grid ${category === 'business' ? 'pricing-cards-grid-business' : ''}`}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPlus = plan.id === 'plus';
          const isPro = plan.id === 'pro';

          return (
            <div
              key={plan.id + plan.name}
              className={`pricing-card ${isPlus ? 'pricing-card-highlighted' : ''} ${isCurrent ? 'pricing-card-current' : ''}`}
            >
              {/* Top Header & Badges */}
              <div className="pricing-card-header">
                <div className="pricing-card-title-row">
                  <span className="pricing-plan-name">{plan.name}</span>
                  {plan.badge && (
                    <span
                      className={`pricing-badge ${
                        plan.isRecommended
                          ? 'pricing-badge-recommended'
                          : isPro
                            ? 'pricing-badge-pro'
                            : 'pricing-badge-default'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                <h3 className="pricing-plan-tagline">{plan.tagline}</h3>
                <p className="pricing-plan-description">{plan.description}</p>
              </div>

              {/* Pricing Tag */}
              <div className="pricing-card-price-wrap">
                <span className="pricing-price-amount">
                  <sup>*</sup>
                  {plan.priceFormatted.replace('₹', '')}
                </span>
                <span className="pricing-price-period">{plan.period}</span>
              </div>

              {/* Action Button */}
              <div className="pricing-card-cta-wrap">
                {isCurrent ? (
                  <button
                    className="pricing-btn pricing-btn-current"
                    type="button"
                    disabled
                  >
                    Your current plan
                  </button>
                ) : isPlus ? (
                  <button
                    onClick={() => handlePlanAction(plan)}
                    className="pricing-btn pricing-btn-plus"
                    type="button"
                  >
                    <span>{plan.buttonText}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanAction(plan)}
                    className="pricing-btn pricing-btn-dark"
                    type="button"
                  >
                    {plan.buttonText}
                  </button>
                )}
              </div>

              {/* Features List */}
              <div className="pricing-card-features-section">
                <span className="pricing-features-heading">{plan.featuresHeader}</span>
                <ul className="pricing-features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="pricing-feature-item">
                      <span className="pricing-feature-icon" aria-hidden="true">
                        {/* Custom SVG Icon based on feature index or plus badge */}
                        {isPlus ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : isPro ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        )}
                      </span>
                      <span className="pricing-feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Taxes Note */}
      <div className="pricing-disclaimer">
        <p>* Prices shown in INR. Billed monthly. Instant activation with PhonePe UPI QR code payment.</p>
      </div>
    </div>
  );

  if (isStandalonePage) {
    return content;
  }

  return (
    <div className="pricing-modal-overlay" onClick={closePricingModal}>
      <div
        className="pricing-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
      >
        {content}
      </div>
    </div>
  );
}
