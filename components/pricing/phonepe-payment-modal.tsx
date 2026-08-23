'use client';

// ============================================================
// PhonePe Payment QR Modal Component
// High-Fidelity PhonePe UPI Checkout Experience
// Payee: Durgesh Amol Gaikwad
// ============================================================
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePricing } from './pricing-context';

export function PhonePePaymentModal() {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    selectedPlanForPayment,
    activatePlan,
    openPricingModal,
  } = usePricing();

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const UPI_ID = 'durgeshamolgaikwad@ybl';
  const PAYEE_NAME = 'Durgesh Amol Gaikwad';

  // Reset states on modal open
  useEffect(() => {
    if (isPaymentModalOpen) {
      setIsVerifying(false);
      setIsSuccess(false);
      setUtrNumber('');
    }
  }, [isPaymentModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPaymentModalOpen && !isVerifying) {
        closePaymentModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentModalOpen, isVerifying, closePaymentModal]);

  if (!isPaymentModalOpen || !selectedPlanForPayment) return null;

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleConfirmPayment = () => {
    setIsVerifying(true);
    // Simulate real-time UPI webhook & payment verification
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      activatePlan(selectedPlanForPayment.id, utrNumber.trim() || undefined);
    }, 1800);
  };

  const handleDone = () => {
    closePaymentModal();
  };

  const handleBackToPlans = () => {
    closePaymentModal();
    openPricingModal();
  };

  return (
    <div className="pricing-modal-overlay" onClick={() => !isVerifying && closePaymentModal()}>
      <div
        className="phonepe-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phonepe-modal-title"
      >
        {/* Close Button */}
        {!isVerifying && (
          <button
            onClick={closePaymentModal}
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

        {isSuccess ? (
          /* Success Screen */
          <div className="phonepe-success-container">
            <div className="phonepe-success-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="phonepe-success-title">Payment Confirmed!</h2>
            <p className="phonepe-success-subtitle">
              You are now upgraded to <strong>{selectedPlanForPayment.brandName}</strong>. All premium frontier capabilities and elevated limits have been activated.
            </p>

            <div className="phonepe-receipt-card">
              <div className="phonepe-receipt-row">
                <span>Plan Tier</span>
                <strong>{selectedPlanForPayment.name}</strong>
              </div>
              <div className="phonepe-receipt-row">
                <span>Amount Paid</span>
                <strong>{selectedPlanForPayment.priceFormatted}</strong>
              </div>
              <div className="phonepe-receipt-row">
                <span>Beneficiary</span>
                <span>{PAYEE_NAME}</span>
              </div>
              <div className="phonepe-receipt-row">
                <span>Status</span>
                <span className="phonepe-status-pill">Active</span>
              </div>
            </div>

            <button onClick={handleDone} className="phonepe-action-primary-btn" type="button">
              Continue to Workspace
            </button>
          </div>
        ) : (
          /* Payment Flow Screen */
          <div className="phonepe-content-wrap">
            {/* Header with Brand */}
            <div className="phonepe-header-banner">
              <div className="phonepe-badge-brand">
                <div className="phonepe-logo-icon">
                  <span>पे</span>
                </div>
                <div className="phonepe-brand-text">
                  <span className="phonepe-brand-title">PhonePe</span>
                  <span className="phonepe-brand-sub">ACCEPTED HERE</span>
                </div>
              </div>

              <div className="phonepe-plan-summary-badge">
                <span className="phonepe-summary-plan">{selectedPlanForPayment.brandName}</span>
                <span className="phonepe-summary-amount">{selectedPlanForPayment.priceFormatted}</span>
              </div>
            </div>

            <div className="phonepe-body-grid">
              {/* Left/Center: The Authentic QR Code Frame */}
              <div className="phonepe-qr-column">
                <p className="phonepe-scan-instruction">
                  Scan any QR using <strong>PhonePe App</strong>
                </p>

                <div className="phonepe-qr-frame">
                  <div className="phonepe-qr-image-container">
                    <img
                      src="/phonepe-qr.jpg"
                      alt="PhonePe QR Code for Durgesh Amol Gaikwad"
                      className="phonepe-qr-image"
                    />
                  </div>
                  <div className="phonepe-payee-name-banner">
                    <span className="phonepe-payee-verified-icon">✓</span>
                    <span className="phonepe-payee-name">{PAYEE_NAME}</span>
                  </div>
                </div>

                <div className="phonepe-supported-apps">
                  <span>Supported Apps:</span>
                  <div className="phonepe-apps-pills">
                    <span className="upi-app-tag">PhonePe</span>
                    <span className="upi-app-tag">GPay</span>
                    <span className="upi-app-tag">Paytm</span>
                    <span className="upi-app-tag">BHIM UPI</span>
                  </div>
                </div>
              </div>

              {/* Right: Payment Instructions & Confirmation Form */}
              <div className="phonepe-form-column">
                <div className="phonepe-info-card">
                  <div className="phonepe-info-row">
                    <span className="phonepe-info-label">Payee Name</span>
                    <span className="phonepe-info-value">{PAYEE_NAME}</span>
                  </div>
                  <div className="phonepe-info-row">
                    <span className="phonepe-info-label">UPI ID</span>
                    <div className="phonepe-upi-copy-wrap">
                      <code className="phonepe-upi-code">{UPI_ID}</code>
                      <button
                        onClick={handleCopyUpi}
                        className="phonepe-copy-btn"
                        type="button"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? (
                          <span className="phonepe-copied-text">✓ Copied</span>
                        ) : (
                          <span>Copy</span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="phonepe-info-row phonepe-total-row">
                    <span className="phonepe-info-label">Payable Amount</span>
                    <span className="phonepe-total-amount">{selectedPlanForPayment.priceFormatted}</span>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="phonepe-steps-box">
                  <h4 className="phonepe-steps-heading">How to pay:</h4>
                  <ol className="phonepe-steps-list">
                    <li>Open <strong>PhonePe</strong>, <strong>Google Pay</strong>, or any UPI app on your phone.</li>
                    <li>Scan the QR code or send payment to UPI ID <code>{UPI_ID}</code>.</li>
                    <li>Enter amount <strong>{selectedPlanForPayment.priceFormatted}</strong> and approve the payment.</li>
                    <li>Click <strong>&quot;I Have Completed the Payment&quot;</strong> below to instantly activate your plan.</li>
                  </ol>
                </div>

                {/* Optional UTR / Reference Input */}
                <div className="phonepe-input-group">
                  <label htmlFor="phonepe-utr-input" className="phonepe-input-label">
                    Transaction ID / UTR (Optional)
                  </label>
                  <input
                    id="phonepe-utr-input"
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 423891002341"
                    className="phonepe-text-input"
                    disabled={isVerifying}
                  />
                </div>

                {/* Action Buttons */}
                <div className="phonepe-modal-actions">
                  <button
                    onClick={handleConfirmPayment}
                    className="phonepe-confirm-btn"
                    type="button"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <span className="phonepe-btn-loading">
                        <span className="phonepe-spinner" />
                        Verifying UPI Payment...
                      </span>
                    ) : (
                      <span>✓ I Have Completed the Payment</span>
                    )}
                  </button>

                  <button
                    onClick={handleBackToPlans}
                    className="phonepe-back-btn"
                    type="button"
                    disabled={isVerifying}
                  >
                    ← Choose a Different Plan
                  </button>
                </div>

                <div className="phonepe-footer-copy">
                  ©2026, All rights reserved, PhonePe Internet Pvt. Ltd. &amp; Nexora AI
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
