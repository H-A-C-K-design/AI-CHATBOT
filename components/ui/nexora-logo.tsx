'use client';

// ============================================================
// NEXORA AI Official Logo Component
// Renders the Official Nexora AI Hexagonal "N" Emblem from /logo.jpg
// ============================================================
import React from 'react';
import Image from 'next/image';

interface NexoraLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  withBackground?: boolean;
}

export function NexoraLogo({
  size = 24,
  className = '',
  glow = false,
  withBackground = false,
}: NexoraLogoProps) {
  return (
    <div
      className={`nexora-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: glow
          ? 'drop-shadow(0 0 12px rgba(16, 163, 127, 0.6)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
        flexShrink: 0,
        background: 'transparent',
      }}
    >
      <Image
        src="/nexora-emblem.png"
        alt="NEXORA AI Logo"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        unoptimized
        priority
      />
    </div>
  );
}
