'use client';

// ============================================================
// Pricing Context & State Management
// Manages active subscription plan tier, pricing modal & PhonePe checkout
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PlanId, PlanTier, UserSubscription } from '@/types';

export const PERSONAL_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    brandName: 'Free',
    tagline: 'Try Nexora AI',
    description: 'Essential AI access for exploring ideas, fast answers, and learning code fundamentals.',
    price: 0,
    priceFormatted: '₹0',
    period: '/ month',
    buttonText: 'Your current plan',
    category: 'personal',
    featuresHeader: 'Start with the basics:',
    features: [
      'Google Gemini 3.5 Flash core model',
      'Standard chat & code assistant',
      'Basic markdown & syntax highlighter',
      'Standard conversational context',
      'Community support',
    ],
  },
  {
    id: 'go',
    name: 'Nexora Go',
    brandName: 'Nexora Go',
    tagline: 'Keep building',
    description: 'Expanded chats, Gemini 3.6 Flash multimodal vision, and faster daily workflows.',
    price: 399,
    priceFormatted: '₹399',
    period: '/ month',
    buttonText: 'Upgrade to Go',
    category: 'personal',
    featuresHeader: 'Everything in Free, and:',
    features: [
      'Google Gemini 3.6 Flash multimodal engine',
      'OpenAI GPT-4o Mini fast assistant',
      'Expanded 1M token context capability',
      'Image & document attachment analysis',
      'File Library & prompt history saving',
      '3x faster response throughput',
    ],
  },
  {
    id: 'plus',
    name: 'Nexora Plus',
    brandName: 'Nexora Plus',
    tagline: 'Your AI powerhouse',
    description: 'Unlock flagship OpenAI GPT-4o, DeepSeek-R1 chain-of-thought reasoning, and autonomous agents.',
    price: 1999,
    priceFormatted: '₹1,999',
    period: '/ month',
    buttonText: '✦ Upgrade to Plus',
    category: 'personal',
    isRecommended: true,
    badge: 'RECOMMENDED',
    featuresHeader: 'Everything in Go, and:',
    features: [
      'OpenAI GPT-4o flagship omni-model',
      'DeepSeek-R1 deep chain-of-thought reasoning',
      'Auto Smart Router dynamic model selection',
      'Autonomous Paper & arXiv Research Analyzer',
      'Live Code Sandbox & interactive artifacts',
      '20 GB Cloud storage for projects & sessions',
      'Priority compute queue with zero throttling',
    ],
  },
  {
    id: 'pro',
    name: 'Nexora Pro',
    brandName: 'Nexora Pro',
    tagline: 'Maximum power',
    description: 'For developers and teams who demand frontier models, deep telemetry, and maximum speed.',
    price: 10699,
    priceFormatted: '₹10,699',
    period: '/ month',
    buttonText: 'Upgrade to Pro',
    category: 'personal',
    badge: '5x  20x',
    featuresHeader: 'Everything in Plus, and:',
    features: [
      '20x higher limits on GPT-4o & DeepSeek-R1',
      'Agent Observability, Traces & Telemetry dashboard',
      'Agent Evals, Benchmarks & accuracy testing',
      '100 GB Cloud storage & custom knowledge bases',
      'Early access to new frontier models & Codex tools',
      'Dedicated high-speed compute & zero rate limits',
      'Priority 24/7 technical developer support',
    ],
  },
];

export const BUSINESS_PLANS: PlanTier[] = [
  {
    id: 'plus',
    name: 'Nexora Team',
    brandName: 'Nexora Team',
    tagline: 'Supercharge your team',
    description: 'Collaborative AI workspace with shared GPT agents, team administration, and higher limits.',
    price: 2499,
    priceFormatted: '₹2,499',
    period: '/ user / month',
    buttonText: 'Upgrade to Team',
    category: 'business',
    isRecommended: true,
    badge: 'POPULAR FOR TEAMS',
    featuresHeader: 'Everything in Plus, and:',
    features: [
      'Higher team message caps on GPT-4o & Gemini Pro',
      'Create and share custom AI agent personas with team',
      'Admin console for workspace user management',
      'Team workspace isolated data & private firewalls',
      'Shared PhonePe / UPI billing & team usage analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Nexora Enterprise',
    brandName: 'Nexora Enterprise',
    tagline: 'Custom controls & scale',
    description: 'Enterprise-grade security, unlimited high-speed frontier access, and dedicated support.',
    price: 4999,
    priceFormatted: '₹4,999',
    period: '/ user / month',
    buttonText: 'Contact & Upgrade',
    category: 'business',
    badge: 'ENTERPRISE SLA',
    featuresHeader: 'Everything in Team, and:',
    features: [
      'Unlimited high-speed frontier model intelligence',
      'Massive 2M context windows for enterprise documents',
      'SAML SSO, SCIM, and domain verification',
      'SOC2 Type II compliance & complete audit telemetry',
      'Dedicated Customer Success Engineer & 99.99% SLA',
    ],
  },
];

interface PricingContextType {
  currentPlan: PlanId;
  subscription: UserSubscription;
  isPricingModalOpen: boolean;
  isPaymentModalOpen: boolean;
  selectedPlanForPayment: PlanTier | null;
  openPricingModal: () => void;
  closePricingModal: () => void;
  openPaymentModal: (plan: PlanTier) => void;
  closePaymentModal: () => void;
  activatePlan: (planId: PlanId, txRef?: string) => void;
  resetToFree: () => void;
}

const PricingContext = createContext<PricingContextType | null>(null);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const [subscription, setSubscription] = useState<UserSubscription>({
    planId: 'free',
    status: 'active',
  });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanTier | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPlan = localStorage.getItem('nexora_user_plan') as PlanId;
        const savedSub = localStorage.getItem('nexora_user_subscription');
        if (savedPlan && ['free', 'go', 'plus', 'pro'].includes(savedPlan)) {
          setCurrentPlan(savedPlan);
        }
        if (savedSub) {
          setSubscription(JSON.parse(savedSub));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const openPricingModal = useCallback(() => {
    setIsPricingModalOpen(true);
  }, []);

  const closePricingModal = useCallback(() => {
    setIsPricingModalOpen(false);
  }, []);

  const openPaymentModal = useCallback((plan: PlanTier) => {
    setSelectedPlanForPayment(plan);
    setIsPaymentModalOpen(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedPlanForPayment(null);
  }, []);

  const activatePlan = useCallback((planId: PlanId, txRef?: string) => {
    const updatedSub: UserSubscription = {
      planId,
      status: 'active',
      activatedAt: new Date().toISOString(),
      upiTxRef: txRef || `UPI-TXN-${Date.now().toString().slice(-6)}`,
      payeeName: 'Durgesh Amol Gaikwad',
    };
    setCurrentPlan(planId);
    setSubscription(updatedSub);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_user_plan', planId);
      localStorage.setItem('nexora_user_subscription', JSON.stringify(updatedSub));
    }
  }, []);

  const resetToFree = useCallback(() => {
    activatePlan('free');
  }, [activatePlan]);

  return (
    <PricingContext.Provider
      value={{
        currentPlan,
        subscription,
        isPricingModalOpen,
        isPaymentModalOpen,
        selectedPlanForPayment,
        openPricingModal,
        closePricingModal,
        openPaymentModal,
        closePaymentModal,
        activatePlan,
        resetToFree,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}
